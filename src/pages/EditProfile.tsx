// src/pages/EditProfile.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/types'; // <-- Importar a interface 'User' do types.ts
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Styled Components ---
const ProfileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 600,
  margin: '0 auto',
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
}));
// --- Fim dos Styled Components ---

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [userData, setUserData] = useState<User>({ // Tipado como User
    id: '', 
    name: '', // Use name instead of firstName/lastName initially
    email: '', 
    password: '',
    phone: '',
    firstName: '',
    lastName: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '', confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const reader = new FileReader();
  
  reader.onload = () => {
    if (reader.result) {
      setProfilePicture(reader.result as string);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // --- useEffect para carregar dados do usuário logado ---
  useEffect(() => {
    const storedLoggedInUser = localStorage.getItem('loggedInUser');
    const storedProfilePictures = localStorage.getItem('profilePictures'); // Nova chave para o mapa de fotos

    let currentUser: User | null = null; // Mantenha esta declaração

    if (storedLoggedInUser) {
      try {
        // --- PONTO DE CORREÇÃO: Parseia e faz a asserção de tipo aqui ---
        // A linha abaixo garante que 'parsedUser' é do tipo 'User'.
        const parsedUser: User = JSON.parse(storedLoggedInUser); // <-- ESSA É A LINHA CHAVE DA CORREÇÃO
        
        currentUser = parsedUser; // Atribui à variável 'currentUser' para uso posterior no useEffect
        setLoggedInUser(parsedUser); // Atualiza o estado 'loggedInUser'

        // Agora, 'parsedUser' é definitivamente 'User', então não há erro de nulidade aqui
        setUserData({
          id: parsedUser.id,
          name: parsedUser.name,
          firstName: parsedUser.firstName || '',
          lastName: parsedUser.lastName || '',
          email: parsedUser.email,
          phone: parsedUser.phone || '', // phone pode ser opcional em User
          password: parsedUser.password,
        });

      } catch (e) {
        navigate('/'); // Redireciona se os dados estiverem corrompidos
        return; // Sai do useEffect
      }
    } else {
      navigate('/');
      return; // Sai do useEffect
    }

    // --- Lógica para carregar a foto de perfil ---
    // 'currentUser' aqui fora do try/catch principal ainda pode ser null,
    // então a verificação 'if (currentUser && storedProfilePictures)' é crucial.
    if (currentUser && storedProfilePictures) {
      try {
        const profilePicturesMap: { [userId: string]: string } = JSON.parse(storedProfilePictures);
        const userPic = profilePicturesMap[currentUser.id]; // Acessa foto pelo ID
        if (userPic) {
          setProfilePicture(userPic);
        } else {
          setProfilePicture(null);
        }
      } catch (e) {
        setProfilePicture(null);
      }
    } else {
      setProfilePicture(null);
    }
  }, [navigate]); // navigate como dependência

  // --- Handlers de Mudança (mantidos do seu código) ---
  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'fullName') {
      const [firstName, ...lastNameParts] = value.split(' ');
      setUserData(prev => ({
        ...prev,
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
      }));
    } else {
      setUserData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      reader.readAsDataURL(file);
    } else { setProfilePictureFile(null); setProfilePicture(null); }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- Handler de Submissão do Formulário (mantido do seu código) ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loggedInUser) { alert("Você precisa estar logado para salvar seu perfil."); navigate('/'); return; }

    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      alert("As novas senhas não coincidem."); return;
    }
    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
        alert("A nova senha deve ter no mínimo 6 caracteres."); return;
    }

    const storedUsers = localStorage.getItem('users');
    let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    // O 'loggedInUser' do estado já é o usuário atual que está logado.
    // Usaremos ele como base para 'currentUserInLS' para tipagem clara.
    const currentUserInLS = users.find(u => u.id === loggedInUser.id);

    if (currentUserInLS) {
      const updatedUser: User = {
        ...currentUserInLS, // Preserva o ID original e outras propriedades
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        password: passwordData.newPassword || currentUserInLS.password,
      };

      users = users.map(user => user.id === updatedUser.id ? updatedUser : user);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

      const storedProfilePictures = localStorage.getItem('profilePictures');
      let profilePicturesMap: { [key: string]: string } = storedProfilePictures ? JSON.parse(storedProfilePictures) : {};

      if (profilePicture && updatedUser.id) {
        profilePicturesMap[updatedUser.id] = profilePicture;
      } else if (updatedUser.id) {
        delete profilePicturesMap[updatedUser.id];
      }
      localStorage.setItem('profilePictures', JSON.stringify(profilePicturesMap));

    } else {
      navigate('/');
      return;
    }

    window.dispatchEvent(new CustomEvent('profileUpdate'));

    navigate('/home');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>Meu Perfil</Typography>
        <ProfileContainer>
          <AvatarContainer>
            <Box onClick={handleAvatarClick} sx={{ cursor: 'pointer' }}>
              <Avatar
                sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
                src={profilePicture || undefined} alt="Foto de perfil"
              >
                {/* Exibe a primeira letra do nome se não houver foto de perfil */}
                {!profilePicture && userData.firstName ? userData.firstName.charAt(0).toUpperCase() : ''}
              </Avatar>
            </Box>
            <input ref={fileInputRef} accept="image/*" style={{ display: 'none' }} id="profile-picture-upload" type="file" onChange={handleProfilePictureChange} />
          </AvatarContainer>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>Informações Pessoais</Typography>
            <TextField
              fullWidth margin="normal" label="Nome Completo" name="fullName"
              value={`${userData.firstName} ${userData.lastName}`}
              onChange={handleUserDataChange} required
            />
            <TextField fullWidth margin="normal" label="Email" name="email" type="email" value={userData.email} onChange={handleUserDataChange} required />
            <TextField fullWidth margin="normal" label="Telefone" name="phone" value={userData.phone} onChange={handleUserDataChange} />
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Alterar Senha</Typography>
            <TextField fullWidth margin="normal" label="Nova Senha" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} />
            <TextField fullWidth margin="normal" label="Confirmar Senha" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate('/home')}>Cancelar</Button>
              <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          </form>
        </ProfileContainer>
      </Box>
    </Container>
  );
};

export default EditProfile;