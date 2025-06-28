// src/pages/NewProject.tsx

import {
  Box,
  Button,
  Container,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react"; // <-- Importar useEffect
import { useNavigate } from "react-router-dom";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import { User, ICreateProjectRequest } from "../types/types"; // <-- Importar User e ICreateProjectRequest do types.ts
import { projectsService } from "../services/api/projects.service";
import { documentsService } from "../services/api/documents.service";
import { ragService } from "../services/api/rag.service";

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState({
    name: "", // Add required name field
    subject: "",
    description: "", // Add required description field
    summary: "",
  });

  // Estado para múltiplos arquivos anexados
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Estado para controlar o erro de nome duplicado
  const [subjectError, setSubjectError] = useState(false);
  const [subjectHelperText, setSubjectHelperText] = useState("");

  // Estado para controlar upload e processamento
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingRAG, setIsProcessingRAG] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // --- NOVO: Estado para armazenar o usuário logado ---
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // --- NOVO: useEffect para carregar o usuário logado ---
  useEffect(() => {
    const storedLoggedInUser = localStorage.getItem("loggedInUser");
    if (storedLoggedInUser) {
      try {
        const user: User = JSON.parse(storedLoggedInUser);
        setLoggedInUser(user);
      } catch (e) {
        navigate("/"); // <-- Redireciona para / (consistente com o App.tsx)
      }
    } else {
      navigate("/"); // <-- Redireciona para o login se não houver usuário logado
    }
  }, [navigate]); // navigate como dependência para evitar avisos do linter

  // --- Funções de Handler ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));

    // Limpa o erro de nome duplicado ao digitar
    if (name === "subject") {
      setSubjectError(false);
      setSubjectHelperText("");
    }
  };

  // Removed unused handleSelectChange function

  // Manipulador para múltiplos arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Validate file count (max 10 files)
      if (filesArray.length > 10) {
        alert("Máximo de 10 arquivos permitidos.");
        return;
      }
      
      // Validate file size (max 10MB each)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      const oversizedFiles = filesArray.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert(`Os seguintes arquivos excedem o limite de 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      setAttachedFiles(filesArray);
    } else {
      setAttachedFiles([]); // Limpa o array se nada for selecionado
    }
  };

  // Função para remover um arquivo específico da lista
  const handleRemoveFile = (fileName: string) => {
    setAttachedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- NOVO: Verificar se o usuário está logado antes de prosseguir ---
    if (!loggedInUser) {
      alert("Você precisa estar logado para criar um projeto.");
      navigate("/"); // <-- Redireciona para /
      return;
    }

    try {
      // Create the project request data
      const projectRequest: ICreateProjectRequest = {
        name: projectData.subject,
        subject: projectData.subject,
        description: projectData.description,
      };

      // Call the API to create the project
      const response = await projectsService.create(projectRequest);
      const createdProject = response.data;
      
      // Handle file uploads if there are attached files
      if (attachedFiles.length > 0) {
        setIsUploading(true);
        setUploadProgress("Fazendo upload dos arquivos...");
        
        try {
          // Upload documents to the project
          await documentsService.uploadDocuments(createdProject.id, attachedFiles);
          setUploadProgress("Arquivos enviados com sucesso!");
          
          // Trigger RAG processing
          setIsProcessingRAG(true);
          setUploadProgress("Processando documentos para IA...");
          
          await ragService.processDocuments(createdProject.id);
          setUploadProgress("Processamento iniciado! Você pode acompanhar o progresso na página do projeto.");
          
          // Wait a moment to show success message
          setTimeout(() => {
            navigate("/home");
          }, 2000);
        } catch (uploadError) {
          setUploadProgress("Erro no upload ou processamento. O projeto foi criado, mas você precisará fazer o upload dos arquivos manualmente.");
          setTimeout(() => {
            navigate("/home");
          }, 3000);
        }
      } else {
        navigate("/home"); // Redireciona para a página home após salvar
      }
    } catch (error: any) {
      
      // Check if it's a duplicate name error from the backend
      if (error.response?.status === 400 && error.response?.data?.message?.includes("already exists")) {
        setSubjectError(true);
        setSubjectHelperText("Você já tem um projeto com este nome.");
      } else {
        // Generic error message
        alert("Erro ao criar o projeto. Por favor, tente novamente.");
      }
    }
  };

  // --- NOVO: Exibir um estado de carregamento se o usuário logado ainda não foi carregado ---
  if (!loggedInUser) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Carregando dados do usuário...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: "center", mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Criar Novo Projeto
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          margin="normal"
          label="Matéria"
          name="subject"
          value={projectData.subject}
          onChange={handleInputChange}
          required
          error={subjectError}
          helperText={subjectHelperText}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Descrição"
          name="description"
          value={projectData.description}
          onChange={handleInputChange}
          required
        />

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

        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept=".pdf,.doc,.docx,.txt,.md" // Tipos de arquivo aceitos pelo backend
            style={{ display: "none" }} // Oculta o input original
            id="raised-button-file"
            multiple // Permite múltiplos arquivos
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<AttachFileIcon />}
            >
              Anexar Arquivos (máx. 10 arquivos, 10MB cada)
            </Button>
          </label>
          {/* Exibir múltiplos arquivos selecionados e opção de remover */}
          {attachedFiles.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: "bold" }}>
                Arquivos selecionados:
              </Typography>
              {attachedFiles.map((file, index) => (
                <Box
                  key={file.name + index}
                  sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ ml: 1, display: "inline-block" }}
                  >
                    {file.name}
                  </Typography>
                  <IconButton // <-- IconButton sendo usado
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFile(file.name)}
                    sx={{ ml: 0.5, p: 0.5 }}
                  >
                    <Box component="span" sx={{ fontSize: "0.8rem" }}>
                      ✖
                    </Box>
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Upload Progress Display */}
        {(isUploading || isProcessingRAG || uploadProgress) && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              {uploadProgress || "Processando..."}
            </Typography>
            {(isUploading || isProcessingRAG) && (
              <Box sx={{ width: '100%', mt: 1 }}>
                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  backgroundColor: 'rgba(255,255,255,0.3)', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fff',
                    animation: 'slideRight 2s ease-in-out infinite'
                  }}></div>
                </div>
              </Box>
            )}
          </Box>
        )}

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          <Button 
            variant="outlined" 
            onClick={() => navigate("/home")}
            disabled={isUploading || isProcessingRAG}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isUploading || isProcessingRAG}
          >
            {isUploading ? "Fazendo Upload..." : 
             isProcessingRAG ? "Processando..." : 
             "Salvar Projeto"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NewProject;
