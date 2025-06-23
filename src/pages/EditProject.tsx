// src/pages/EditProject.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IconButton, // <-- Importar IconButton para o botão de anexo
} from '@mui/material';

import AttachFileIcon from '@mui/icons-material/AttachFile';

import { Project, User, IUpdateProjectRequest } from '../types/types'; // <-- CRUCIAL: Importar Project e User do types.ts
import { projectsService } from '../services/api/projects.service';

export const EditProject: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado para os dados do projeto
  const [projectData, setProjectData] = useState<Project>({
    id: '',
    name: '', // Add required name field
    subject: '',
    description: '', // Add required description field
    professorId: '', // Add required professorId field
    status: 'Rascunho',
    summary: '',
    authorId: '', // <-- Inicializa o authorId
    author: '',
    createdAt: '', // Add required createdAt field
    updatedAt: '',
    avatarColor: '',
    attachedFileNames: [], // <-- Inicializa como array vazio
  });

  // Estado para o arquivo anexado (objeto File, usado para o preview de um novo anexo)
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // --- Estado para armazenar o usuário logado ---
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // --- useEffect para carregar o usuário logado ---
  useEffect(() => {
    const storedLoggedInUser = localStorage.getItem('loggedInUser');
    if (storedLoggedInUser) {
      try {
        const user: User = JSON.parse(storedLoggedInUser);
        setLoggedInUser(user);
      } catch (e) {
        console.error("Erro ao parsear loggedInUser no EditProject:", e);
        navigate('/'); // <-- Redireciona para / (consistente com o App.tsx)
      }
    } else {
      navigate('/'); // <-- Redireciona para /
    }
  }, [navigate]); // navigate como dependência

  // --- Carrega os dados do projeto via API ---
  useEffect(() => {
    if (!loggedInUser || !id) return; // Espera o loggedInUser ser carregado antes de buscar o projeto

    const fetchProject = async () => {
      try {
        const response = await projectsService.getById(id);
        const project = response.data;
        
        // Map API data to local Project format
        const mappedProject: Project = {
          ...project,
          authorId: project.professorId,
          author: loggedInUser.name || `${loggedInUser.firstName} ${loggedInUser.lastName}`,
          status: projectData.status || 'Rascunho', // Keep current status
          summary: projectData.summary || '', // Keep current summary
          avatarColor: projectData.avatarColor || '#2196f3',
          updatedAt: project.createdAt,
          attachedFileNames: projectData.attachedFileNames || [],
        };
        
        setProjectData(mappedProject);
        
        // Handle file attachments display
        if (mappedProject.attachedFileNames && mappedProject.attachedFileNames.length > 0) {
          setAttachedFile(new File([], mappedProject.attachedFileNames[0]));
        } else {
          setAttachedFile(null);
        }
      } catch (error) {
        console.error("Erro ao buscar projeto:", error);
        alert("Projeto não encontrado ou você não tem permissão para editá-lo.");
        navigate('/home');
      }
    };

    fetchProject();
  }, [id, navigate, loggedInUser]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name as string]: value }));
  };

  // --- handleFileChange para attachedFileNames (array) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setAttachedFile(selectedFile); // Define o arquivo File real (para o preview)
      // Atualiza projectData com o nome do novo arquivo em um array
      setProjectData(prev => ({ ...prev, attachedFileNames: [selectedFile.name] }));
    } else {
      setAttachedFile(null);
      setProjectData(prev => ({ ...prev, attachedFileNames: [] })); // Limpa os nomes se nada for selecionado
    }
  };
  // --- Fim do handleFileChange ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Verificar se o usuário está logado antes de salvar ---
    if (!loggedInUser || !id) {
        alert("Você precisa estar logado para salvar as alterações.");
        navigate('/'); // <-- Redireciona para /
        return;
    }

    try {
      // Prepare update data for API
      const updateData: IUpdateProjectRequest = {
        name: projectData.subject,
        subject: projectData.subject,
        description: projectData.description,
      };

      // Update project via API
      await projectsService.update(id, updateData);
      
      // TODO: Handle file uploads separately if needed
      
      navigate('/home');
    } catch (error: any) {
      console.error("Erro ao atualizar projeto:", error);
      
      // Check if it's a duplicate name error
      if (error.response?.status === 400 && error.response?.data?.message?.includes("already exists")) {
        alert('Você já tem outro projeto com este nome. Por favor, escolha outro nome.');
      } else {
        alert("Erro ao salvar as alterações. Por favor, tente novamente.");
      }
    }
  };

  // --- Exibir estado de carregamento se o usuário ou projeto não carregou ---
  if (!loggedInUser || (id && !projectData.id)) { // Se é edição e projectData ainda não carregou
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Carregando projeto...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Projeto: **{projectData.subject || 'Carregando...'}**
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Matéria"
          name="subject"
          value={projectData.subject}
          onChange={handleInputChange}
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={projectData.status}
            label="Status"
            onChange={handleSelectChange}
            required
          >
            <MenuItem value="Rascunho">Rascunho</MenuItem>
            <MenuItem value="Em andamento">Em andamento</MenuItem>
            <MenuItem value="Concluído">Concluído</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          label="Resumo"
          name="summary"
          multiline
          rows={4}
          value={projectData.summary}
          onChange={handleInputChange}
        />

        {/* --- Campo de Anexar Arquivo --- */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept="image/*,.pdf,.doc,.docx"
            style={{ display: 'none' }}
            id="raised-button-file-edit"
            multiple={false} // Para edição, geralmente se permite 1 arquivo por vez
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file-edit">
            <Button
              variant="outlined"
              component="span"
              startIcon={<AttachFileIcon />}
            >
              Anexar Novo Arquivo
            </Button>
          </label>
          {/* Exibir o nome do arquivo atualmente anexado ou do novo selecionado */}
          {attachedFile && (
            <Typography variant="body2" sx={{ mt: 1, ml: 1, display: 'inline-block' }}>
              Arquivo selecionado: **{attachedFile.name}**
            </Typography>
          )}
          {/* Botão para remover anexo existente (aparece se houver nome de arquivo e nenhum novo foi selecionado) */}
          {projectData.attachedFileNames && projectData.attachedFileNames.length > 0 && !attachedFile && (
            <Button
              variant="text"
              color="error"
              size="small"
              sx={{ ml: 2, mt: 1 }}
              onClick={() => {
                setAttachedFile(null); // Limpa o File do preview
                setProjectData(prev => ({ ...prev, attachedFileNames: [] })); // Limpa o nome do arquivo no estado do projeto
              }}
            >
              Remover Anexo
            </Button>
          )}
        </Box>
        {/* --- Fim do Campo de Anexar Arquivo --- */}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/home')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
          >
            Salvar Alterações
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default EditProject;