import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Badge,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";
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
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Description as MarkdownIcon,
  Article as DocIcon,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import { useWebSocketChat } from "../hooks/useWebSocketChat";
import { Project, User } from "../types/types";
import { projectsService } from "../services/api/projects.service";
import {
  generatedFilesService,
  GeneratedFile,
} from "../services/api/generatedFiles.service";
import { FileModal } from "../components/FileModal";
import { VersionSelectionModal } from "../components/VersionSelectionModal";
import { FileGenerationStatus } from "../components/FileGenerationStatus";
import { FOOTER_HEIGHT } from "../components/Footer";

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

// Removed unused ChatContainer styled component

const MessagesArea = styled(Paper)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(1),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  maxHeight: `calc(100vh - 120px - ${FOOTER_HEIGHT} - 200px)`, // Fixed height with footer space
  paddingBottom: FOOTER_HEIGHT, // Add padding to prevent content behind footer
}));

const MessageBubble = styled(Box)<{ owner: "USER" | "ASSISTANT" }>(
  ({ theme, owner }) => ({
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.borderRadius,
    maxWidth: "80%",
    wordBreak: "break-word",
    marginBottom: theme.spacing(2),
    alignSelf: owner === "USER" ? "flex-end" : "flex-start",
    backgroundColor:
      owner === "USER" ? theme.palette.primary.main : theme.palette.grey[100],
    color:
      owner === "USER"
        ? theme.palette.common.white
        : theme.palette.text.primary,
    animation: `${fadeInUp} 0.3s ease-out`,
    position: "relative",
  })
);

const StreamingMessage = styled(MessageBubble)(({ theme }) => ({
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 8,
    right: 12,
    width: "3px",
    height: "1.2em",
    backgroundColor: theme.palette.text.primary,
    animation: "blink 1s infinite",
  },
  "@keyframes blink": {
    "0%, 50%": { opacity: 1 },
    "51%, 100%": { opacity: 0 },
  },
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  alignItems: "flex-end",
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

const StatusBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.info.light,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  minHeight: "40px",
}));

const SourcesPanel = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  borderLeft: `4px solid ${theme.palette.info.main}`,
}));

const drawerWidth = 320;
const sidebarWidth = 280;

const WebSocketChatPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileModalMode, setFileModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Load project and user data using API
  useEffect(() => {
    const fetchProjectData = async () => {
      const storedLoggedInUser = localStorage.getItem("loggedInUser");

      if (!storedLoggedInUser) {
        navigate("/login");
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
            status: "Rascunho" as const,
            summary: "",
            avatarColor: "#2196f3",
            updatedAt: apiProject.createdAt,
            attachedFileNames: [],
          };

          setProject(mappedProject);
        }
      } catch (e) {
        alert(
          "Projeto não encontrado ou você não tem permissão para acessá-lo."
        );
        navigate("/home");
      }
    };

    fetchProjectData();
    setLoading(false);
  }, [projectId, navigate]);

  // Initialize WebSocket chat after project is loaded
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
    connect,
    getFileGenerationStatus,
    fileGenerationUpdates,
  } = wsChat;

  // Show loading state while project loads
  const showLoading = loading || !project || !loggedInUser;

  // Load generated files
  const loadFiles = useCallback(async () => {
    if (!projectId) return;

    setFilesLoading(true);
    try {
      const response = await generatedFilesService.listFiles(projectId);
      // Extract files from nested response structure
      const filesData = response.data?.data?.files || [];
      setFiles(filesData);
    } catch (error) {
      console.error("Error loading files:", error);
      setFiles([]); // Reset to empty array on error
    } finally {
      setFilesLoading(false);
    }
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (project) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, project]);

  // Load conversations when connected
  useEffect(() => {
    if (isConnected && projectId && project) {
      loadConversations(projectId);
      loadFiles();
    }
  }, [isConnected, projectId, loadConversations, project, loadFiles]);

  // Refresh files when generation completes
  useEffect(() => {
    const completedFiles = Array.from(fileGenerationUpdates.values()).filter(
      (update) => update.status === "completed"
    );

    if (completedFiles.length > 0) {
      // Small delay to ensure backend has fully processed the file
      const timer = setTimeout(() => {
        loadFiles();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [fileGenerationUpdates, loadFiles]);

  if (showLoading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px - 50px)",
            flexDirection: "column",
            p: 3,
          }}
        >
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" component="h1" gutterBottom>
            {loading ? "Carregando projeto..." : "Conectando ao chat..."}
          </Typography>
        </Box>
      </Container>
    );
  }

  const handleSendMessage = () => {
    if (message.trim() === "" || !isConnected) return;

    sendMessage(message.trim());
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    loadConversation(conversationId);
    setDrawerOpen(false);
  };

  const handleCreateFile = () => {
    setFileModalMode("create");
    setSelectedFile(null);
    setFileModalOpen(true);
  };

  const handleEditFile = (file: GeneratedFile) => {
    setFileModalMode("edit");
    setSelectedFile(file);
    setFileModalOpen(true);
  };

  const handleDownloadFile = async (file: GeneratedFile) => {
    // Check if there are multiple versions with content
    const versionsWithContent = file.versions.filter((v) => v.hasContent);

    if (versionsWithContent.length > 1) {
      setSelectedFile(file);
      setVersionModalOpen(true);
    } else {
      // Download the current version or latest version with content
      const targetVersion =
        file.currentVersion ||
        versionsWithContent[versionsWithContent.length - 1]?.version ||
        1;
      await downloadFileVersion(file, targetVersion);
    }
  };

  const downloadFileVersion = async (file: GeneratedFile, version: number) => {
    setDownloadingFile(file.id);
    try {
      // Use backend download for all file formats
      const response = await generatedFilesService.downloadFile(
        projectId!,
        file.id,
        version
      );

      // Check if response is a blob or has a data property
      const blob = response.data || response;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${file.displayName}.${file.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Download error:", error);
      if (error?.response?.status === 401) {
        alert("Sessão expirada. Faça login novamente.");
      } else {
        alert(
          `Falha no download: ${
            error?.response?.data?.message ||
            error.message ||
            "Erro desconhecido"
          }`
        );
      }
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteFile = async (file: GeneratedFile) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o arquivo "${file.displayName}"? Esta ação não pode ser desfeita.`
    );

    if (confirmDelete) {
      try {
        await generatedFilesService.deleteFile(projectId!, file.id);
        loadFiles(); // Refresh the file list
        alert("Arquivo excluído com sucesso.");
      } catch (error) {
        alert("Falha ao excluir arquivo. Tente novamente.");
      }
    }
  };

  const handleFileModalSuccess = () => {
    loadFiles();
  };

  const getFileIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <PdfIcon />;
      case "markdown":
        return <MarkdownIcon />;
      case "docx":
        return <DocIcon />;
      default:
        return <DocIcon />;
    }
  };

  const getFileTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      "study-guide": "Guia de Estudo",
      quiz: "Quiz",
      summary: "Resumo",
      "lesson-plan": "Plano de Aula",
      custom: "Customizado",
    };
    return types[type] || type;
  };

  const getStatusDisplay = () => {
    if (connectionError) {
      return {
        color: "error" as const,
        text: `Erro de Conexão: ${connectionError}`,
        icon: <DisconnectedIcon />,
      };
    }

    if (isConnecting) {
      return {
        color: "warning" as const,
        text: "Conectando ao WebSocket...",
        icon: <CircularProgress size={16} />,
      };
    }

    if (!isConnected) {
      return {
        color: "error" as const,
        text: "Desconectado",
        icon: <DisconnectedIcon />,
      };
    }

    if (currentStatus) {
      return {
        color:
          currentStatus.status === "error"
            ? ("error" as const)
            : ("info" as const),
        text: currentStatus.message,
        icon:
          currentStatus.status === "processing" ? (
            <CircularProgress size={16} />
          ) : (
            <ConnectedIcon />
          ),
      };
    }

    return {
      color: "success" as const,
      text: "Conectado - Pronto para conversar",
      icon: <ConnectedIcon />,
    };
  };

  const statusDisplay = getStatusDisplay();

  if (!projectId) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          ID do projeto inválido
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{ display: "flex", height: `calc(100vh - 64px - ${FOOTER_HEIGHT})` }}
    >
      {/* Files Sidebar */}
      <Paper
        sx={{
          width: sidebarWidth,
          display: "flex",
          flexDirection: "column",
          borderRadius: 0,
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="h6">Arquivos</Typography>
            <IconButton size="small" onClick={handleCreateFile} color="primary">
              <AddIcon />
            </IconButton>
          </Box>
          {project && (
            <Typography variant="body2" color="text.secondary">
              {project.subject}
            </Typography>
          )}
        </Box>

        {/* Active File Generations */}
        {Array.from(fileGenerationUpdates.values()).filter(
          (update) =>
            update.status === "pending" || update.status === "generating"
        ).length > 0 && (
          <Box sx={{ px: 1, mb: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Gerações em Andamento
            </Typography>
            {Array.from(fileGenerationUpdates.values())
              .filter(
                (update) =>
                  update.status === "pending" || update.status === "generating"
              )
              .map((update) => (
                <FileGenerationStatus
                  key={update.fileId}
                  fileId={update.fileId}
                  fileName={
                    files.find((f) => f.id === update.fileId)?.displayName ||
                    "Arquivo"
                  }
                  update={update}
                  onRetry={() => {
                    // Retry functionality can be implemented later
                  }}
                />
              ))}
          </Box>
        )}

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {filesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : files.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum arquivo ainda
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {files.map((file) => (
                <ListItem key={file.id} sx={{ px: 1, py: 0.5 }}>
                  <Card sx={{ width: "100%" }}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box sx={{ mr: 1, color: "text.secondary" }}>
                          {getFileIcon(file.format)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold", mb: 0.5 }}
                          >
                            {file.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getFileTypeLabel(file.fileType)} • v
                            {file.currentVersion}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditFile(file)}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadFile(file)}
                            disabled={downloadingFile === file.id}
                          >
                            {downloadingFile === file.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DownloadIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFile(file)}
                            color="error"
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateFile}
            size="small"
          >
            Novo Arquivo
          </Button>
        </Box>
      </Paper>

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <IconButton
            color="primary"
            onClick={() => navigate("/home")}
            aria-label="voltar"
          >
            <ArrowBackIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, textAlign: "center", mr: 4 }}>
            <Typography variant="h6" component="h1">
              Chat com IA
            </Typography>
            {project && (
              <Typography variant="body2" color="text.secondary">
                {project.subject}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
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

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
          {/* Connection Status */}
          <StatusBar>
            {statusDisplay.icon}
            <Typography variant="body2" color={statusDisplay.color}>
              {statusDisplay.text}
            </Typography>
            {error && (
              <Button size="small" onClick={clearError} sx={{ ml: "auto" }}>
                Dismiss
              </Button>
            )}
          </StatusBar>

          {/* Processing Progress */}
          {isStreaming && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                IA está gerando resposta...
              </Typography>
            </Box>
          )}

          {/* Messages Area */}
          <MessagesArea>
            {messages.length === 0 && !isStreaming && (
              <Box
                sx={{
                  textAlign: "center",
                  mt: 4,
                  mb: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <ChatIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {isConnected
                    ? "Inicie uma conversa em tempo real!"
                    : "Conectando ao WebSocket..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isConnected
                    ? "Envie uma mensagem e veja a IA responder em tempo real."
                    : "Por favor, aguarde enquanto estabelecemos a conexão."}
                </Typography>
              </Box>
            )}

            {messages.map((msg, index) => (
              <Box key={msg.id}>
                <MessageBubble owner={msg.role}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {msg.role === "USER" ? (
                      <PersonIcon sx={{ fontSize: 18, mr: 1 }} />
                    ) : (
                      <BotIcon sx={{ fontSize: 18, mr: 1 }} />
                    )}
                    <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                      {msg.role === "USER" ? "Você" : "Assistente IA"}
                    </Typography>
                    <Typography variant="caption" sx={{ ml: "auto" }}>
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </Typography>

                  {/* Show sources for AI messages */}
                  {msg.role === "ASSISTANT" &&
                    msg.metadata?.sources &&
                    msg.metadata.sources.length > 0 && (
                      <SourcesPanel>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: "bold", display: "block", mb: 1 }}
                        >
                          Fontes consultadas:
                        </Typography>
                        {/* Remove duplicates by filename */}
                        {msg.metadata.sources
                          .filter(
                            (source: any, idx: number, arr: any[]) =>
                              arr.findIndex(
                                (s) => s.filename === source.filename
                              ) === idx
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
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <BotIcon sx={{ fontSize: 18, mr: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    Assistente IA
                  </Typography>
                  <Typography variant="caption" sx={{ ml: "auto" }}>
                    Transmitindo...
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {streamingContent}
                </Typography>
              </StreamingMessage>
            )}

            {/* Show current sources during streaming */}
            {isStreaming && sources.length > 0 && (
              <SourcesPanel>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: "bold", display: "block", mb: 1 }}
                >
                  Consultando fontes:
                </Typography>
                {/* Remove duplicates by filename */}
                {sources
                  .filter(
                    (source, idx, arr) =>
                      arr.findIndex((s) => s.filename === source.filename) ===
                      idx
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
              placeholder={
                isConnected ? "Digite algo..." : "Conectando ao chat..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected || isStreaming}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={message.trim() === "" || !isConnected || isStreaming}
              startIcon={
                isStreaming ? <CircularProgress size={20} /> : <SendIcon />
              }
              sx={{ minWidth: 120 }}
            >
              {isStreaming ? "Enviando..." : "Enviar"}
            </Button>
          </InputArea>
        </Box>
      </Box>

      {/* Conversations Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderLeft: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Conversas
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {conversations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma conversa ainda. Comece a conversar para criar uma!
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
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* File Modal */}
      <FileModal
        open={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        projectId={projectId!}
        mode={fileModalMode}
        file={selectedFile || undefined}
        onSuccess={handleFileModalSuccess}
      />

      {/* Version Selection Modal */}
      {selectedFile && (
        <VersionSelectionModal
          open={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          file={selectedFile}
          onVersionSelect={(version) => {
            downloadFileVersion(selectedFile, version);
            setVersionModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default WebSocketChatPage;
