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
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { authService } from '../services/api/auth.service';
import { TokenManager } from '../services/api/axiosConfig';

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
    firstName: '',
    lastName: ''
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- useEffect para carregar dados do usuário logado ---
  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First check if we have tokens
        const accessToken = TokenManager.getAccessToken();
        if (!accessToken) {
          navigate('/');
          return;
        }

        // Fetch profile from API
        const response = await authService.getProfile();
        const professor = response.data;

        // Update local state with API data
        setLoggedInUser(professor);
        
        // Parse name into firstName and lastName for the form
        const nameParts = professor.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setUserData({
          id: professor.id,
          name: professor.name,
          firstName: firstName,
          lastName: lastName,
          email: professor.email,
          password: '', // Don't show password
        });

        // Update localStorage with fresh data
        localStorage.setItem('loggedInUser', JSON.stringify({
          ...professor,
          firstName,
          lastName
        }));

        // Load profile picture from localStorage
        const storedProfilePictures = localStorage.getItem('profilePictures');
        if (storedProfilePictures) {
          try {
            const profilePicturesMap: { [userId: string]: string } = JSON.parse(storedProfilePictures);
            const userPic = profilePicturesMap[professor.id];
            if (userPic) {
              setProfilePicture(userPic);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      } catch (error: any) {
        console.error('Error loading profile:', error);
        if (error.response?.status === 401) {
          // Token expired or invalid
          TokenManager.clearTokens();
          navigate('/');
        } else {
          setError('Erro ao carregar perfil. Tente novamente.');
          // Fallback to localStorage if API fails
          const storedLoggedInUser = localStorage.getItem('loggedInUser');
          if (storedLoggedInUser) {
            try {
              const parsedUser: User = JSON.parse(storedLoggedInUser);
              setLoggedInUser(parsedUser);
              setUserData({
                id: parsedUser.id,
                name: parsedUser.name,
                firstName: parsedUser.firstName || '',
                lastName: parsedUser.lastName || '',
                email: parsedUser.email,
                password: '',
              });
            } catch (e) {
              navigate('/');
            }
          } else {
            navigate('/');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  // --- Handlers de Mudança (mantidos do seu código) ---
  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null);
    setSuccess(null);
    
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSuccess(null);

    if (!loggedInUser) { 
      setError("Você precisa estar logado para salvar seu perfil."); 
      navigate('/'); 
      return; 
    }


    setIsSaving(true);

    try {
      // Prepare update data for API
      const updateData: any = {
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
      };

      // Call API to update profile
      const response = await authService.updateProfile(updateData);
      const updatedProfessor = response.data;

      // Parse name back into firstName and lastName for consistency
      const nameParts = updatedProfessor.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update local state with response
      const updatedUser: User = {
        ...updatedProfessor,
        firstName,
        lastName,
      };

      setLoggedInUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

      // Update profile picture in localStorage
      const storedProfilePictures = localStorage.getItem('profilePictures');
      let profilePicturesMap: { [key: string]: string } = storedProfilePictures ? JSON.parse(storedProfilePictures) : {};

      if (profilePicture && updatedUser.id) {
        profilePicturesMap[updatedUser.id] = profilePicture;
      } else if (updatedUser.id) {
        delete profilePicturesMap[updatedUser.id];
      }
      localStorage.setItem('profilePictures', JSON.stringify(profilePicturesMap));

      // Dispatch event to update Header
      window.dispatchEvent(new CustomEvent('profileUpdate'));

      setSuccess('Perfil atualizado com sucesso!');
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        if (message?.includes('email')) {
          setError('Este e-mail já está em uso por outro usuário.');
        } else {
          setError(message || 'Dados inválidos.');
        }
      } else if (error.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          TokenManager.clearTokens();
          navigate('/');
        }, 2000);
      } else {
        setError('Erro ao atualizar perfil. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>Meu Perfil</Typography>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ProfileContainer>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/home')}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Box>
          </form>
        </ProfileContainer>
        )}
      </Box>
    </Container>
  );
};

export default EditProfile;