// src/pages/Register.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterFormData } from '../types/types';
import { authService } from '../services/api/auth.service';
import { TokenManager } from '../services/api/axiosConfig';
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Imports de Imagens ---
import backgroundImage from '../assets/background_login.png';
import logoImage from '../assets/logo2.png';
// --- Fim dos imports de imagens ---

// --- Styled Components ---
const AuthContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '400px',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxShadow: theme.shadows[3],
  borderRadius: 0,
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '2rem',
  marginBottom: theme.spacing(4),
  color: theme.palette.primary.main,
  textAlign: 'center',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
  },
}));

const AuthButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
}));

const DividerWithText = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  '&::before, &::after': {
    borderColor: theme.palette.divider,
  },
}));
// --- Fim dos Styled Components ---

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [emailError, setEmailError] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [passwordMatchHelperText, setPasswordMatchHelperText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RegisterFormData) => ({ ...prev, [name]: value })); // <-- 'prev' tipado

    // Limpa mensagens de erro ao digitar
    setGeneralError('');
    setSuccessMessage('');
    
    // Validação de email em tempo real
    if (name === 'email') {
      if (value === '') {
        setEmailError(false);
        setEmailHelperText('');
      } else if (!validateEmail(value)) {
        setEmailError(true);
        setEmailHelperText('E-mail inválido');
      } else {
        setEmailError(false);
        setEmailHelperText('');
      }
    }

    // Validação de senhas em tempo real
    if (name === 'password' || name === 'confirmPassword') {
      const newPassword = name === 'password' ? value : formData.password;
      const newConfirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;

      if (newConfirmPassword && newPassword !== newConfirmPassword) {
        setPasswordMatchError(true);
        setPasswordMatchHelperText('As senhas não coincidem');
      } else {
        setPasswordMatchError(false);
        setPasswordMatchHelperText('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError(false);
    setEmailHelperText('');
    setPasswordMatchError(false);
    setPasswordMatchHelperText('');
    setGeneralError('');
    setSuccessMessage('');

    // Validação final do email
    const isEmailValid = validateEmail(formData.email);
    if (!isEmailValid) {
      setEmailError(true);
      setEmailHelperText('Por favor, insira um e-mail válido.');
      return;
    }

    // Validação final da senha
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatchError(true);
      setPasswordMatchHelperText('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    if (formData.password.length < 6) {
      setPasswordMatchError(true);
      setPasswordMatchHelperText('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    // Verificar campos obrigatórios
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setGeneralError('Nome e sobrenome são obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare registration data
      const registrationData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password
      };

      // Call API for registration
      const response = await authService.signUp(registrationData);
      
      const { accessToken, refreshToken, professor } = response.data;
      
      // Store tokens securely
      TokenManager.setAccessToken(accessToken);
      TokenManager.setRefreshToken(refreshToken);
      
      // Store user data for UI purposes (but auth relies on tokens)
      localStorage.setItem('loggedInUser', JSON.stringify(professor));
      
      console.log('Usuário registrado:', professor);
      
      // Show success message
      setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        if (message?.includes('email') || message?.includes('already exists')) {
          setEmailError(true);
          setEmailHelperText('Este e-mail já está cadastrado.');
        } else {
          setGeneralError(message || 'Dados inválidos.');
        }
      } else if (error.response?.status === 422) {
        setGeneralError('Dados inválidos. Verifique as informações.');
      } else {
        setGeneralError('Erro de conexão. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
    }}>
      <Box sx={{
        flex: 1,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      <Box sx={{
        width: '400px',
        flexShrink: 0,
      }}>
        <form onSubmit={handleSubmit}>
          <AuthContainer> {/* Usa o AuthContainer estilizado */}
            {/* --- Box para a logo --- */}
            <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
              <img src={logoImage} alt="Logo StudyFlow" height="150" /> {/* Ajuste a altura */}
            </Box>
            {/* --- Título do Cadastro --- */}
            <LogoText>Cadastro</LogoText>

            {/* Error and Success Messages */}
            {generalError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {generalError}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            <StyledTextField
              fullWidth margin="normal" label="Nome" name="firstName"
              value={formData.firstName} onChange={handleChange} required
            />
            <StyledTextField
              fullWidth margin="normal" label="Sobrenome" name="lastName"
              value={formData.lastName} onChange={handleChange} required
            />
            <StyledTextField
              fullWidth margin="normal" label="Email" name="email" type="email"
              value={formData.email} onChange={handleChange} required
              error={emailError} helperText={emailHelperText}
            />
            <StyledTextField
              fullWidth margin="normal" label="Telefone" name="phone" type="tel"
              value={formData.phone} onChange={handleChange}
            />
            <StyledTextField
              fullWidth margin="normal" label="Senha" name="password" type="password"
              value={formData.password} onChange={handleChange} required
              error={passwordMatchError} helperText={passwordMatchHelperText}
            />
            <StyledTextField
              fullWidth margin="normal" label="Confirmar Senha" name="confirmPassword" type="password"
              value={formData.confirmPassword} onChange={handleChange} required
              error={passwordMatchError} helperText={passwordMatchHelperText}
            />

            <AuthButton
              fullWidth type="submit" variant="contained" color="primary" size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </AuthButton>

            <DividerWithText>já tem conta?</DividerWithText> {/* Divisor */}

            <Button
              fullWidth variant="outlined" color="primary" size="large"
              sx={{ borderRadius: '4px', fontWeight: 600, }}
              onClick={() => navigate('/')}
              disabled={isLoading}
            >
              Fazer Login
            </Button>
          </AuthContainer>
        </form>
      </Box>
    </Box>
  );
};

export default Register;