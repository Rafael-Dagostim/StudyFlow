// src/pages/Home.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import { Project, User } from '../types/types'; // Importar Project e User do types.ts
import { projectsService } from '../services/api/projects.service';

const ProjectCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
}));

export const Home: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation(); // Comente ou remova se não for mais usar para location.state

  const [projects, setProjects] = useState<Project[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const storedLoggedInUser = localStorage.getItem('loggedInUser');
      if (storedLoggedInUser) {
        try {
          const user: User = JSON.parse(storedLoggedInUser);
          setLoggedInUser(user);

          // Fetch projects from API
          const response = await projectsService.getAll();
          const userProjects = response.data.map((project: any) => ({
            ...project,
            authorId: project.professorId, // Map professorId to authorId for compatibility
            author: user.name || `${user.firstName} ${user.lastName}`,
            status: 'Rascunho' as const, // Default status
            summary: '', // Default summary
            avatarColor: '#2196f3', // Default color
            updatedAt: project.createdAt,
          }));
          setProjects(userProjects);
        } catch (e) {
          console.error("Erro ao buscar projetos:", e);
          setProjects([]); // Set empty array on error
        }
      } else {
        navigate('/login'); // Redireciona para o login se não houver usuário logado
      }
      setLoading(false);
    };

    fetchProjects();
  }, [navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento': return 'primary';
      case 'Concluído': return 'success';
      case 'Rascunho': return 'default';
      default: return 'default';
    }
  };

  const handleEditProject = (projectId: string) => {
    navigate(`/edit-project/${projectId}`);
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      try {
        // Delete project via API
        await projectsService.delete(projectToDelete);
        
        // Update local state by removing the deleted project
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete));
        
        setOpenDeleteDialog(false);
        setProjectToDelete(null);
      } catch (error) {
        console.error("Erro ao deletar projeto:", error);
        alert("Erro ao deletar o projeto. Por favor, tente novamente.");
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setProjectToDelete(null);
  };

  // --- NOVO: Função para navegar para a página de chat ---
  const handleGoToChat = (projectId: string) => {
    navigate(`/chat/${projectId}`); // Navega para a nova rota de chat com o ID do projeto
  };
  // --- Fim da nova função ---

  // --- Exibir estado de carregamento ---
  if (loading || !loggedInUser) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px - 50px)', // Altura da tela - Header - Footer
        flexDirection: 'column',
        p: 3
      }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" component="h1" gutterBottom>
          Carregando seus projetos...
        </Typography>
      </Box>
    );
  }

  // --- Conteúdo da página Home após carregamento ---
  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Meus Projetos
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/new-project')}
          sx={{
            borderRadius: '20px',
            py: 1.5,
            px: 3,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Novo Projeto
        </Button>
      </Box>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {projects.length > 0 ? (
          projects.map((project: Project) => (
            <div key={project.id}>
              <ProjectCard>
                <CardContent sx={{ flexGrow: 1 }}>
                  <StatusChip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />

                  <Typography gutterBottom variant="h5" component="h2">
                    {project.subject}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {project.summary}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: project.avatarColor,
                        width: 32,
                        height: 32,
                        mr: 1.5,
                      }}
                    >
                      {project.author.charAt(0)}
                    </Avatar>
                    <Typography variant="caption">
                      {project.author} • {project.updatedAt}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditProject(project.id)}
                  >
                    Editar
                  </Button>
                  {/* --- NOVO BOTÃO: Conversar --- */}
                  <Button
                    size="small"
                    color="primary" // Você pode escolher outra cor se quiser
                    onClick={() => handleGoToChat(project.id)} // Chama a função para navegar para o chat
                  >
                    Conversar
                  </Button>
                  {/* --- Fim do NOVO BOTÃO --- */}
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(project.id)}
                  >
                    Excluir
                  </Button>
                </CardActions>
              </ProjectCard>
            </div>
          ))
        ) : (
          // Renderiza 'null' quando não há projetos (texto "Nenhum projeto encontrado" foi removido)
          null
        )}
      </div>

      <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir este projeto?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;