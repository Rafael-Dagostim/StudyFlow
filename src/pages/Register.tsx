// src/pages/Register.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterFormData, User } from '../types/types'; // <-- Importar 'User' e 'RegisterFormData' do 'types.ts'
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Paper,
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RegisterFormData) => ({ ...prev, [name]: value })); // <-- 'prev' tipado

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    // --- Lógica para salvar usuário no localStorage ---
    const storedUsers = localStorage.getItem('users');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    // Verificar se o e-mail já está cadastrado
    const emailExists = users.some((user: User) => user.email === formData.email);

    if (emailExists) {
      setEmailError(true);
      setEmailHelperText('Este e-mail já está cadastrado.');
      return; // Impede o cadastro
    }

    // Criar novo objeto de usuário
    const newUser: User = {
      id: Date.now().toString(), // Adicionar id único
      name: `${formData.firstName} ${formData.lastName}`.trim(), // Add required name field
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    // --- Fim da lógica para salvar usuário ---

    console.log('Usuário registrado:', newUser);
    // Após o cadastro, redirecionar para a tela de Login
    navigate('/'); // Redireciona explicitamente para /
    alert('Cadastro realizado com sucesso! Faça login.'); // Feedback para o usuário
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
            >
              Cadastrar
            </AuthButton>

            <DividerWithText>já tem conta?</DividerWithText> {/* Divisor */}

            <Button
              fullWidth variant="outlined" color="primary" size="large"
              sx={{ borderRadius: '4px', fontWeight: 600, }}
              onClick={() => navigate('/')} // <-- Correção: usar '/' de forma explícita
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