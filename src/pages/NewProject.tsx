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
        console.error("Erro ao parsear loggedInUser no NewProject:", e);
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
      // Converte o FileList (retornado pelo navegador) para um array de File
      setAttachedFiles(Array.from(e.target.files));
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
      
      console.log("Novo projeto criado:", response.data);
      
      // TODO: Handle file uploads separately if needed
      if (attachedFiles.length > 0) {
        console.log(
          "Arquivos anexados (nomes):",
          attachedFiles.map((file) => file.name)
        );
        // You'll need to implement document upload API call here
      }

      navigate("/home"); // Redireciona para a página home após salvar
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      
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
            accept="image/*,.pdf,.doc,.docx" // Tipos de arquivo aceitos
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
              Anexar Arquivos
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

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}
        >
          <Button variant="outlined" onClick={() => navigate("/home")}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Salvar Projeto
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NewProject;
