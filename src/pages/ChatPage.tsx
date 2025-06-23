// src/pages/ChatPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Ícone de seta para trás
import { Project, User } from '../types/types'; // Importar Project e User do types.ts
import { projectsService } from '../services/api/projects.service';

// Basic styled components for chat layout
const ChatContainer = styled(Container)(({ theme }) => ({
  height: 'calc(100vh - 64px - 50px)', // Altura da viewport menos Header e Footer
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[100], // Fundo cinza claro
}));

const MessagesBox = styled(Box)(({ theme }) => ({
  flexGrow: 1, // Faz a caixa de mensagens ocupar o espaço restante
  overflowY: 'auto', // Adiciona scroll se as mensagens excederem a altura
  padding: theme.spacing(1),
  backgroundColor: theme.palette.common.white, // Fundo branco para a área de mensagens
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column-reverse', // Para que as novas mensagens apareçam no final e o scroll "para cima"
}));

// Interface para as props customizadas do MessageBubble (para tipar a prop 'owner')
interface MessageBubbleProps {
  owner: 'user' | 'ai'; // 'owner' é uma prop customizada que MessageBubble vai receber
}

const MessageBubble = styled(Paper)<MessageBubbleProps>(({ theme, owner }) => ({ // Passa a interface aqui
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  maxWidth: '70%', // Bolha de mensagem não ocupa a largura total
  wordBreak: 'break-word', // Quebra palavras longas para evitar overflow
  marginBottom: theme.spacing(1),
  // Estilos baseados no 'owner' (se é o usuário ou a IA)
  alignSelf: owner === 'user' ? 'flex-end' : 'flex-start', // Alinha à direita (usuário) ou esquerda (IA)
  backgroundColor: owner === 'user' ? theme.palette.primary.main : theme.palette.grey[300], // Cor da bolha
  color: owner === 'user' ? theme.palette.common.white : theme.palette.text.primary, // Cor do texto
}));

const InputBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

// Interface para o formato de cada mensagem
interface Message {
  id: string;
  text: string;
  owner: 'user' | 'ai'; // Quem enviou a mensagem
  timestamp: string;
  fileName?: string; // Nome do arquivo, se for um anexo
}

// Interface para o mapa de históricos de chat no localStorage
interface ChatHistoriesMap {
  [projectId: string]: Message[];
}

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Pega o ID do projeto da URL
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para o input de arquivo oculto
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref para rolar até a última mensagem

  const [project, setProject] = useState<Project | null>(null); // Estado para o projeto atual
  const [messages, setMessages] = useState<Message[]>([]); // Estado para as mensagens do chat
  const [newMessage, setNewMessage] = useState(''); // Estado para o texto da nova mensagem
  const [attachedFile, setAttachedFile] = useState<File | null>(null); // Estado para o arquivo anexado

  // --- useEffect para carregar o projeto usando API ---
  useEffect(() => {
    const fetchProjectData = async () => {
      const storedLoggedInUser = localStorage.getItem('loggedInUser');
      const storedChatHistories = localStorage.getItem('chatHistories'); // Carrega o mapa de históricos de chat

      if (!storedLoggedInUser) {
        navigate('/login'); // Redireciona para login se não estiver logado
        return;
      }

      try {
        const loggedInUser: User = JSON.parse(storedLoggedInUser);

        if (id) {
          // Fetch project from API
          const response = await projectsService.getById(id);
          const apiProject = response.data;
          
          // Map API project to local Project format
          const mappedProject: Project = {
            ...apiProject,
            authorId: apiProject.professorId,
            author: loggedInUser.name || `${loggedInUser.firstName} ${loggedInUser.lastName}`,
            status: 'Rascunho' as const,
            summary: '',
            avatarColor: '#2196f3',
            updatedAt: apiProject.createdAt,
            attachedFileNames: [],
          };
          
          setProject(mappedProject);

          // Carrega as mensagens para este projeto específico
          if (storedChatHistories) {
            try {
              const chatHistoriesMap: ChatHistoriesMap = JSON.parse(storedChatHistories);
              if (chatHistoriesMap[mappedProject.id]) {
                setMessages(chatHistoriesMap[mappedProject.id]);
              } else {
                setMessages([]); // Nenhum histórico para este projeto
              }
            } catch (e) {
              console.error('Erro ao parsear histórico de chat do localStorage:', e);
              setMessages([]);
            }
          } else {
            setMessages([]); // Nenhum mapa de históricos de chat encontrado
          }
        }
      } catch (e) {
        console.error('Erro ao carregar projeto:', e);
        alert('Projeto não encontrado ou você não tem permissão para acessá-lo.');
        navigate('/home'); // Redireciona se o projeto não for encontrado
      }
    };

    fetchProjectData();
  }, [id, navigate]); // Dependências: ID do projeto e função de navegação

  // --- useEffect para salvar mensagens no localStorage ---
  useEffect(() => {
    if (project && messages) { // Salva apenas se o projeto estiver carregado e o estado de mensagens não for nulo
      const storedChatHistories = localStorage.getItem('chatHistories');
      let chatHistoriesMap: ChatHistoriesMap = storedChatHistories ? JSON.parse(storedChatHistories) : {};

      if (messages.length > 0) {
        chatHistoriesMap[project.id] = messages; // Salva as mensagens para o ID do projeto atual
        localStorage.setItem('chatHistories', JSON.stringify(chatHistoriesMap));
        console.log(`Histórico de chat para o projeto ${project.id} salvo no localStorage.`);
      } else { // Se todas as mensagens forem removidas, remove a entrada do projeto do mapa
        if (chatHistoriesMap[project.id]) { // Somente remove se a entrada existia
            delete chatHistoriesMap[project.id];
            localStorage.setItem('chatHistories', JSON.stringify(chatHistoriesMap));
            console.log(`Histórico de chat para o projeto ${project.id} removido do localStorage.`);
        }
      }
    }
  }, [messages, project]); // Dependências: estado de mensagens (para acionar o salvamento) e estado do projeto (para o ID)

  // --- useEffect para rolar até a última mensagem ---
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // Rola sempre que as mensagens são atualizadas


  const handleSendMessage = () => {
    if (newMessage.trim() === '' && !attachedFile) return; // Não envia mensagem vazia sem anexo

    const timestamp = new Date().toLocaleTimeString(); // Hora atual para o timestamp da mensagem
    const messageText = attachedFile ? `Anexo: ${attachedFile.name}` : newMessage.trim(); // Texto da mensagem ou nome do anexo

    const newMsg: Message = {
      id: Date.now().toString(), // ID único para a mensagem
      text: messageText,
      owner: 'user', // A mensagem é do usuário
      timestamp: timestamp,
      fileName: attachedFile ? attachedFile.name : undefined, // Nome do arquivo, se houver
    };

    setMessages((prev) => [...prev, newMsg]); // Adiciona a nova mensagem ao FINAL do array
    setNewMessage(''); // Limpa o campo de texto
    setAttachedFile(null); // Limpa o anexo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reseta o valor do input de arquivo oculto
    }
    // A simulação de resposta da IA foi removida, conforme solicitado
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Envia a mensagem ao pressionar Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Previne a quebra de linha padrão no TextField
      handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file); // Define o arquivo anexado
      setNewMessage(''); // Limpa o texto da mensagem se um arquivo for anexado
      console.log('Arquivo anexado:', file.name);
    }
  };

  // Exibe um estado de carregamento ou "acesso negado" enquanto o projeto não é carregado
  if (!project) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
          <Typography variant="h6" component="h1" gutterBottom>
            Carregando projeto ou acesso negado...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ChatContainer maxWidth="md">
      {/* --- BOTÃO DE VOLTAR --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton color="primary" onClick={() => navigate('/home')} aria-label="voltar">
          <ArrowBackIcon /> {/* Ícone de seta para trás */}
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1, textAlign: 'center', mr: 4 }}> {/* Título do chat */}
          Chat com IA sobre: **{project.subject}**
        </Typography>
        <Box sx={{ width: 48 }} /> {/* Placeholder para alinhamento se não houver ícone à direita */}
      </Box>
      {/* --- FIM DO BOTÃO DE VOLTAR --- */}

      <MessagesBox>
        {/* Mensagem de início de conversa se não houver mensagens */}
        {messages.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 'auto', mb: 2 }}>
                Comece a conversar sobre seu projeto!
            </Typography>
        )}
        {/* Renderiza as mensagens */}
        {messages.map((msg) => (
          // MessageBubble recebe a prop 'owner' para estilização
          <MessageBubble key={msg.id} owner={msg.owner} sx={{ margin: msg.owner === 'user' ? '0 0 8px auto' : '0 auto 8px 0' }}>
            <Typography variant="body1">{msg.text}</Typography>
            {msg.fileName && <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>{msg.fileName}</Typography>}
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>{msg.timestamp}</Typography>
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} /> {/* Elemento para rolar até a última mensagem */}
      </MessagesBox>

      <InputBox>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder="Digite sua mensagem..."
          value={attachedFile ? `Anexo: ${attachedFile.name}` : newMessage} // Exibe nome do anexo ou texto da mensagem
          onChange={(e) => {
            if (!attachedFile) setNewMessage(e.target.value); // Só permite digitar se não há anexo
          }}
          onKeyPress={handleKeyPress}
          disabled={!!attachedFile} // Desabilita input de texto se há anexo
          InputProps={{
            endAdornment: (
              <>
                {/* Input de arquivo oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {/* Botão de Anexar Arquivo */}
                <IconButton color="primary" component="span" onClick={() => fileInputRef.current?.click()}>
                  <AttachFileIcon />
                </IconButton>
                {/* Botão de Enviar Mensagem */}
                <IconButton color="primary" onClick={handleSendMessage} disabled={newMessage.trim() === '' && !attachedFile}>
                  <SendIcon />
                </IconButton>
              </>
            ),
          }}
        />
        {/* Botão para remover o anexo */}
        {attachedFile && (
          <Button variant="outlined" size="small" onClick={() => {
            setAttachedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reseta input de arquivo
          }} sx={{ whiteSpace: 'nowrap' }}>
            Remover Anexo
          </Button>
        )}
      </InputBox>
    </ChatContainer>
  );
};

export default ChatPage;