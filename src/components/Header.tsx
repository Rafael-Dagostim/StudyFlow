// src/components/Header.tsx

import React, { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AppBar, Toolbar, IconButton, Avatar, Button } from '@mui/material'; // 'Button' importado
import { AccountCircle } from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout'; // Ícone de Logout importado
import { useNavigate } from 'react-router-dom';
import { User } from '../types/types';
import { authService } from '../services/api/auth.service';
import { TokenManager } from '../services/api/axiosConfig';

import logoImage from '../assets/logo3.png'; // Caminho para a imagem da sua logo

const Header = () => {
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string>('');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null); // Estado para armazenar o objeto do usuário logado

  // Função para carregar a foto e a inicial do usuário do localStorage
  const loadProfileData = () => {
    const storedLoggedInUser = localStorage.getItem('loggedInUser');
    const storedProfilePictures = localStorage.getItem('profilePictures'); // Nova chave para o mapa de fotos

    console.log('Header - Carregando dados para o usuário logado:');
    console.log('  storedLoggedInUser:', storedLoggedInUser ? storedLoggedInUser.substring(0, 50) + '...' : null);
    console.log('  storedProfilePictures:', storedProfilePictures ? storedProfilePictures.substring(0, 50) + '...' : null);

    let parsedLoggedInUser: User | null = null; // Variável temporária para o usuário parseado
    if (storedLoggedInUser) {
      try {
        parsedLoggedInUser = JSON.parse(storedLoggedInUser);
        setLoggedInUser(parsedLoggedInUser); // Atualiza o estado do usuário logado
      } catch (e) {
        console.error('Header: Erro ao parsear loggedInUser do localStorage', e);
        setLoggedInUser(null); // Limpa o estado em caso de erro
        parsedLoggedInUser = null; // Limpa a variável temporária também
      }
    } else {
      setLoggedInUser(null); // Ninguém logado, limpa o estado
    }

    // --- Lógica para inicial do usuário (usando parsedLoggedInUser) ---
    // Agora, 'parsedLoggedInUser' é verificado antes de acessar suas propriedades
    if (parsedLoggedInUser && parsedLoggedInUser.firstName) {
      setUserInitial(parsedLoggedInUser.firstName.charAt(0).toUpperCase());
    } else {
      setUserInitial('');
    }

    // --- Lógica para foto de perfil (usando parsedLoggedInUser) ---
    if (parsedLoggedInUser && storedProfilePictures) {
      try {
        const profilePicturesMap: { [userId: string]: string } = JSON.parse(storedProfilePictures);
        const userPic = profilePicturesMap[parsedLoggedInUser.id]; // Acessa a foto pelo ID do usuário
        if (userPic) {
          setProfilePicture(userPic);
        } else {
          setProfilePicture(null);
        }
      } catch (e) {
        console.error('Header: Erro ao parsear profilePictures do localStorage', e);
        setProfilePicture(null);
      }
    } else {
      setProfilePicture(null); // Sem usuário logado ou sem mapa de fotos
    }
  };

  // useEffect para carregar dados na montagem e ouvir eventos de atualização
  useEffect(() => {
    loadProfileData(); // Carrega os dados na montagem inicial do componente

    // Handler do evento customizado 'profileUpdate'
    const handleProfileUpdate = () => {
      console.log('Header: Evento "profileUpdate" recebido! Recarregando dados...');
      loadProfileData(); // Rerecarrega os dados do localStorage quando o evento é disparado
    };

    // Adiciona o ouvinte do evento customizado na janela global
    window.addEventListener('profileUpdate', handleProfileUpdate as EventListener);

    // Função de limpeza: remove o ouvinte ao desmontar o componente
    return () => {
      window.removeEventListener('profileUpdate', handleProfileUpdate as EventListener);
    };
  }, []); // Array de dependências vazio para rodar apenas uma vez na montagem/desmontagem

  // Função para lidar com o Logout
  const handleLogout = async () => {
    try {
      // Call API to invalidate session on server
      await authService.signOut();
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear local authentication data
    TokenManager.clearTokens();
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('profilePictures'); // Clear profile pictures as well
    
    navigate('/'); // Redirect to login
    console.log("Usuário deslogado. Dados de sessão limpos.");
  };

  // O ícone de usuário e de logout só aparecerão se houver um usuário logado
  const isUserLoggedIn = loggedInUser !== null;


  return (
    <AppBar
      position="static" // Permanece no topo da página ao rolar
      sx={{
        backgroundColor: '#000019', // Cor de fundo do cabeçalho
        height: '64px', // Altura fixa para o cabeçalho
        minHeight: '64px', // Garante que a altura mínima também seja respeitada
      }}
    >
      <Toolbar
        sx={{
          height: '100%', // Faz com que a Toolbar ocupe toda a altura do AppBar
          minHeight: 'auto', // Sobrescreve o min-height padrão da Toolbar para se ajustar ao AppBar
        }}
      >
        {/* Ícone da Logo - Clicável para navegar para a Home */}
        <IconButton
          edge="start" // Alinha à esquerda da Toolbar
          color="inherit" // Herda a cor do AppBar
          aria-label="home" // Rótulo para acessibilidade
          sx={{ mr: 2 }} // Margem à direita
          onClick={() => navigate('/home')} // Navega para a Home ao clicar
        >
          <img
            src={logoImage} // Fonte da imagem da logo
            alt="StudyFlow Logo" // Texto alternativo para acessibilidade
            style={{
              height: 'auto',
              width: '200px',
              maxHeight: '100%',
            }}
          />
        </IconButton>

        {/* --- Renderiza Ícones de Usuário e Logout APENAS SE HOUVER UM USUÁRIO LOGADO --- */}
        {isUserLoggedIn && (
          <>
            {/* Ícone de usuário no canto direito */}
            <IconButton
              color="inherit"
              onClick={() => navigate('/edit-profile')}
              sx={{ ml: 'auto' }} // Empurra o ícone do usuário (e o de Logout que vem depois) para a direita
            >
              <Avatar
                sx={{ width: 32, height: 32 }}
                src={profilePicture || undefined} // Usa a imagem Base64 do perfil (se existir)
                onError={(e) => {
                  // Handler de erro caso a imagem do perfil falhe ao carregar
                  console.error("Erro ao carregar a imagem de perfil no Header:", e);
                  setProfilePicture(null); // Limpa o src para forçar a exibição da inicial ou do ícone
                }}
              >
                {/* Exibe a inicial do nome do usuário OU o ícone AccountCircle como fallback */}
                {userInitial || <AccountCircle />}
              </Avatar>
            </IconButton>

            {/* --- Ícone de Logout (apenas ícone) --- */}
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ ml: 1 }} // Margem à esquerda para separar do ícone do usuário
              aria-label="logout" // Rótulo para acessibilidade
            >
              <LogoutIcon /> {/* O ícone de Logout */}
            </IconButton>
            {/* --- Fim do Ícone de Logout --- */}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;