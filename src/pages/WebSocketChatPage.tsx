import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Drawer,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Chat as ChatIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { Project, User } from '../types/types';
import { projectsService } from '../services/api/projects.service';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ChatContainer = styled(Container)(({ theme }) => ({
  height: 'calc(100vh - 64px - 50px)', // Match original ChatPage height calculation
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[100]
}));

const MessagesArea = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  minHeight: '400px'
}));

const MessageBubble = styled(Box)<{ owner: 'USER' | 'ASSISTANT' }>(({ theme, owner }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  maxWidth: '80%',
  wordBreak: 'break-word',
  marginBottom: theme.spacing(2),
  alignSelf: owner === 'USER' ? 'flex-end' : 'flex-start',
  backgroundColor: owner === 'USER' 
    ? theme.palette.primary.main 
    : theme.palette.grey[100],
  color: owner === 'USER' 
    ? theme.palette.common.white 
    : theme.palette.text.primary,
  animation: `${fadeInUp} 0.3s ease-out`,
  position: 'relative'
}));

const StreamingMessage = styled(MessageBubble)(({ theme }) => ({
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 8,
    right: 12,
    width: '3px',
    height: '1.2em',
    backgroundColor: theme.palette.text.primary,
    animation: 'blink 1s infinite'
  },
  '@keyframes blink': {
    '0%, 50%': { opacity: 1 },
    '51%, 100%': { opacity: 0 }
  }
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'flex-end',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2]
}));

const StatusBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.info.light,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minHeight: '40px'
}));

const SourcesPanel = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  borderLeft: `4px solid ${theme.palette.info.main}`
}));

const drawerWidth = 320;

const WebSocketChatPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load project and user data using API
  useEffect(() => {
    const fetchProjectData = async () => {
      const storedLoggedInUser = localStorage.getItem('loggedInUser');

      if (!storedLoggedInUser) {
        navigate('/login');
        return;
      }

      try {
        const user: User = JSON.parse(storedLoggedInUser);
        setLoggedInUser(user);

        if (projectId) {
          // Fetch project from API
          const response = await projectsService.getById(projectId);
          const apiProject = response.data;
          
          // Map API project to local Project format
          const mappedProject: Project = {
            ...apiProject,
            authorId: apiProject.professorId,
            author: user.name || `${user.firstName} ${user.lastName}`,
            status: 'Rascunho' as const,
            summary: '',
            avatarColor: '#2196f3',
            updatedAt: apiProject.createdAt,
            attachedFileNames: [],
          };
          
          setProject(mappedProject);
        }
      } catch (e) {
        console.error('Erro ao carregar dados do usuário/projeto:', e);
        alert('Projeto não encontrado ou você não tem permissão para acessá-lo.');
        navigate('/home');
      }
    };

    fetchProjectData();
    setLoading(false);
  }, [projectId, navigate]);

  // Only initialize WebSocket chat after project is loaded
  const wsChat = useWebSocketChat(projectId!, !!project);

  const {
    isConnected,
    isConnecting,
    connectionError,
    currentStatus,
    messages,
    conversations,
    currentConversation,
    sources,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    loadConversations,
    loadConversation,
    clearError,
    clearMessages,
    connect
  } = wsChat;

  // Show loading state while project loads
  const showLoading = loading || !project || !loggedInUser;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (project) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, project]);

  // Load conversations when connected
  useEffect(() => {
    if (isConnected && projectId && project) {
      loadConversations(projectId);
    }
  }, [isConnected, projectId, loadConversations, project]);

  if (showLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px - 50px)',
          flexDirection: 'column',
          p: 3
        }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" component="h1" gutterBottom>
            {loading ? 'Carregando projeto...' : 'Conectando ao WebSocket...'}
          </Typography>
        </Box>
      </Container>
    );
  }



  const handleSendMessage = () => {
    if (message.trim() === '' || !isConnected) return;
    
    sendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    loadConversation(conversationId);
    setDrawerOpen(false);
  };

  const getStatusDisplay = () => {
    if (connectionError) {
      return {
        color: 'error' as const,
        text: `Connection Error: ${connectionError}`,
        icon: <DisconnectedIcon />
      };
    }
    
    if (isConnecting) {
      return {
        color: 'warning' as const,
        text: 'Connecting to WebSocket...',
        icon: <CircularProgress size={16} />
      };
    }
    
    if (!isConnected) {
      return {
        color: 'error' as const,
        text: 'Disconnected',
        icon: <DisconnectedIcon />
      };
    }
    
    if (currentStatus) {
      return {
        color: currentStatus.status === 'error' ? 'error' as const : 'info' as const,
        text: currentStatus.message,
        icon: currentStatus.status === 'processing' ? <CircularProgress size={16} /> : <ConnectedIcon />
      };
    }
    
    return {
      color: 'success' as const,
      text: 'Connected - Ready for real-time chat',
      icon: <ConnectedIcon />
    };
  };

  const statusDisplay = getStatusDisplay();

  if (!projectId) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          Invalid project ID
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Header similar to original ChatPage */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 2 }}>
        <IconButton 
          color="primary" 
          onClick={() => navigate('/home')}
          aria-label="voltar"
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, textAlign: 'center', mr: 4 }}>
          <Typography variant="h5" component="h1">
            Chat com IA sobre: **{project.subject}**
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            WebSocket Streaming Chat
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setDrawerOpen(true)}>
            <Badge badgeContent={conversations?.length || 0} color="primary">
              <HistoryIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={clearMessages}>
            <ClearIcon />
          </IconButton>

          <IconButton onClick={connect} disabled={isConnecting}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <ChatContainer maxWidth="md">
        {/* Connection Status */}
        <StatusBar>
          {statusDisplay.icon}
          <Typography variant="body2" color={statusDisplay.color}>
            {statusDisplay.text}
          </Typography>
          {error && (
            <Button 
              size="small" 
              onClick={clearError}
              sx={{ ml: 'auto' }}
            >
              Dismiss
            </Button>
          )}
        </StatusBar>

        {/* Processing Progress */}
        {isStreaming && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              AI is generating response...
            </Typography>
          </Box>
        )}

        {/* Messages Area */}
        <MessagesArea>
          {messages.length === 0 && !isStreaming && (
            <Box sx={{ 
              textAlign: 'center', 
              mt: 4, 
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isConnected 
                  ? 'Start a real-time conversation!' 
                  : 'Connecting to WebSocket...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isConnected 
                  ? 'Send a message and watch the AI respond in real-time with streaming.'
                  : 'Please wait while we establish the connection.'}
              </Typography>
            </Box>
          )}

          {messages.map((msg, index) => (
            <Box key={msg.id}>
              <MessageBubble owner={msg.role}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {msg.role === 'USER' ? (
                    <PersonIcon sx={{ fontSize: 18, mr: 1 }} />
                  ) : (
                    <BotIcon sx={{ fontSize: 18, mr: 1 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {msg.role === 'USER' ? 'You' : 'AI Assistant'}
                  </Typography>
                  <Typography variant="caption" sx={{ ml: 'auto' }}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>

                {/* Show sources for AI messages */}
                {msg.role === 'ASSISTANT' && msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                  <SourcesPanel>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                      Sources consulted:
                    </Typography>
                    {/* Remove duplicates by filename */}
                    {msg.metadata.sources
                      .filter((source: any, idx: number, arr: any[]) => 
                        arr.findIndex(s => s.filename === source.filename) === idx
                      )
                      .map((source: any, idx: number) => (
                        <Chip
                          key={idx}
                          label={source.filename}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 0.5 }}
                        />
                      ))}
                  </SourcesPanel>
                )}
              </MessageBubble>
            </Box>
          ))}

          {/* Streaming Message */}
          {isStreaming && streamingContent && (
            <StreamingMessage owner="ASSISTANT">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BotIcon sx={{ fontSize: 18, mr: 1 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  Streaming...
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {streamingContent}
              </Typography>
            </StreamingMessage>
          )}

          {/* Show current sources during streaming */}
          {isStreaming && sources.length > 0 && (
            <SourcesPanel>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                Consulting sources:
              </Typography>
              {/* Remove duplicates by filename */}
              {sources
                .filter((source, idx, arr) => 
                  arr.findIndex(s => s.filename === source.filename) === idx
                )
                .map((source, idx) => (
                  <Chip
                    key={idx}
                    label={source.filename}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 0.5 }}
                  />
                ))}
            </SourcesPanel>
          )}

          <div ref={messagesEndRef} />
        </MessagesArea>

        {/* Input Area */}
        <InputArea>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder={isConnected ? "Type your message..." : "Connecting to WebSocket..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isStreaming}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={message.trim() === '' || !isConnected || isStreaming}
            startIcon={isStreaming ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ minWidth: 120 }}
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </Button>
        </InputArea>
      </ChatContainer>

      {/* Conversations Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: drawerWidth }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Conversations
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {conversations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No conversations yet. Start chatting to create one!
            </Typography>
          ) : (
            <List>
              {conversations.map((conv) => (
                <ListItem key={conv.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleConversationSelect(conv.id)}
                    selected={currentConversation?.id === conv.id}
                  >
                    <ListItemText
                      primary={conv.title}
                      secondary={new Date(conv.updatedAt).toLocaleDateString()}
                      primaryTypographyProps={{
                        sx: { 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default WebSocketChatPage;