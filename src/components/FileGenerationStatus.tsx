import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  Refresh as RetryIcon,
  HourglassEmpty as PendingIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';
import { FileGenerationUpdate } from '../services/websocket.service';

interface FileGenerationStatusProps {
  fileId: string;
  fileName: string;
  update?: FileGenerationUpdate;
  onRetry?: () => void;
}

export const FileGenerationStatus: React.FC<FileGenerationStatusProps> = ({
  fileId,
  fileName,
  update,
  onRetry
}) => {
  if (!update) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'generating': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': 
        return <PendingIcon sx={{ fontSize: 16 }} />;
      case 'generating': 
        return <AutorenewIcon sx={{ 
          fontSize: 16, 
          '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
          },
          animation: 'spin 1s linear infinite' 
        }} />;
      case 'completed': 
        return <CompletedIcon sx={{ fontSize: 16 }} />;
      case 'failed': 
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      default: 
        return <PendingIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'generating': return 'Gerando';
      case 'completed': return 'Concluído';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getStatusIcon(update.status)}
              label={getStatusText(update.status)}
              color={getStatusColor(update.status) as any}
              size="small"
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {fileName}
            </Typography>
          </Box>
          
          {update.status === 'failed' && onRetry && (
            <Tooltip title="Tentar novamente">
              <IconButton size="small" onClick={onRetry}>
                <RetryIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {update.status === 'generating' && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progresso
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {update.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={update.progress} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {update.message && (
          <Typography 
            variant="caption" 
            color={update.status === 'failed' ? 'error' : 'text.secondary'}
            sx={{ display: 'block', mt: 1 }}
          >
            {update.message}
          </Typography>
        )}

        {update.status === 'failed' && update.errorMessage && (
          <Alert severity="error" sx={{ mt: 1, p: 1 }}>
            <Typography variant="caption">
              {update.errorMessage}
            </Typography>
          </Alert>
        )}

        {update.status === 'completed' && (
          <Alert severity="success" sx={{ mt: 1, p: 1 }}>
            <Typography variant="caption">
              Arquivo gerado com sucesso! Você pode baixá-lo agora.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FileGenerationStatus;