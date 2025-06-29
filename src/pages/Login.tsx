// src/pages/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/auth.service";
import { TokenManager } from "../services/api/axiosConfig";
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// --- Imports de Imagens ---
import backgroundImage from "../assets/background_login.png";
import logoImage from "../assets/logo2.png";
// --- Fim dos imports de imagens ---

// --- Styled Components ---
const LoginContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: "400px",
  height: "100vh", // Ocupa a altura total da viewport
  display: "flex",
  flexDirection: "column",
  justifyContent: "center", // Centraliza o conteúdo verticalmente
  boxShadow: theme.shadows[3],
  borderRadius: 0, // Sem bordas arredondadas para ocupar a lateral
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "2rem",
  marginBottom: theme.spacing(4),
  color: theme.palette.primary.main,
  textAlign: "center",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius,
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
}));

const DividerWithText = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  "&::before, &::after": {
    borderColor: theme.palette.divider,
  },
}));
// --- Fim dos Styled Components ---

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [emailError, setEmailError] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordHelperText, setPasswordHelperText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpa erros ao digitar
    if (name === "email") {
      setEmailError(false);
      setEmailHelperText("");
    }
    if (name === "password") {
      setPasswordError(false);
      setPasswordHelperText("");
    }

    // Limpa erro geral
    setGeneralError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError(false);
    setEmailHelperText("");
    setPasswordError(false);
    setPasswordHelperText("");
    setGeneralError("");

    const isEmailValid = validateEmail(formData.email);
    if (!isEmailValid) {
      setEmailError(true);
      setEmailHelperText("Por favor, insira um e-mail válido.");
      return;
    }

    if (!formData.password.trim()) {
      setPasswordError(true);
      setPasswordHelperText("Senha é obrigatória.");
      return;
    }

    setIsLoading(true);

    try {
      debugger;
      // Call API for authentication
      const response = await authService.signIn({
        email: formData.email,
        password: formData.password,
      });

      const { accessToken, refreshToken, professor } = response.data;

      // Store tokens securely
      TokenManager.setAccessToken(accessToken);
      TokenManager.setRefreshToken(refreshToken);

      // User data is already included in login response
      const user = professor;

      // Store user data for UI purposes (but auth relies on tokens)
      localStorage.setItem("loggedInUser", JSON.stringify(user));

      navigate("/home");
    } catch (error: any) {
      if (error.response?.status === 401) {
        setEmailError(true);
        setPasswordError(true);
        setEmailHelperText("E-mail ou senha incorretos.");
        setPasswordHelperText("E-mail ou senha incorretos.");
      } else if (error.response?.status === 400) {
        setGeneralError(error.response.data.message || "Dados inválidos.");
      } else {
        setGeneralError("Erro de conexão. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh", // Garante que a box principal ocupe toda a altura da viewport
      }}
    >
      {/* Box para a imagem de fundo (lado esquerdo) */}
      <Box
        sx={{
          flex: 1, // Ocupa o espaço restante
          backgroundImage: `url(${backgroundImage})`, // Usa a imagem importada
          backgroundSize: "cover", // Garante que a imagem cubra toda a área
          backgroundPosition: "center", // Centraliza a imagem
          backgroundRepeat: "no-repeat", // Impede a repetição da imagem
        }}
      />

      {/* Box que contém o formulário de login (lado direito) */}
      <Box
        sx={{
          width: "400px", // Largura fixa para o formulário
          flexShrink: 0, // Não permite que esta box encolha
        }}
      >
        <form onSubmit={handleSubmit}>
          <LoginContainer>
            {/* --- Box para a logo --- */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 2,
              }}
            >
              <img src={logoImage} alt="Logo StudyFlow" height="300" />
            </Box>

            {/* Error Alert */}
            {generalError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {generalError}
              </Alert>
            )}

            <StyledTextField
              fullWidth
              name="email"
              label="E-mail"
              variant="outlined"
              margin="normal"
              value={formData.email}
              onChange={handleChange}
              required
              error={emailError}
              helperText={emailHelperText}
            />

            <StyledTextField
              fullWidth
              name="password"
              label="Senha"
              type="password"
              variant="outlined"
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              required
              error={passwordError} // NOVO: Ativa o estilo de erro
              helperText={passwordHelperText} // NOVO: Exibe a mensagem de erro
            />

            <LoginButton
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </LoginButton>

            <DividerWithText>ou</DividerWithText>

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              size="large"
              sx={{
                borderRadius: "4px",
                fontWeight: 600,
              }}
              onClick={() => navigate("/register")}
              disabled={isLoading}
            >
              Cadastre-se
            </Button>
          </LoginContainer>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
