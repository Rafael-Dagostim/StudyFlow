import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Box,
  Divider
} from '@mui/material';
import type { GeneratedFile } from '../types/types';

interface VersionSelectionModalProps {
  open: boolean;
  onClose: () => void;
  file: GeneratedFile;
  onVersionSelect: (version: number) => void;
}

export const VersionSelectionModal: React.FC<VersionSelectionModalProps> = ({
  open,
  onClose,
  file,
  onVersionSelect
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableVersions = file.versions
    .filter(v => v.hasContent)
    .sort((a, b) => b.version - a.version);

  const handleVersionSelect = (version: number) => {
    onVersionSelect(version);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Selecionar Versão
        <Typography variant="body2" color="text.secondary">
          {file.displayName}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <List>
          {availableVersions.map((version, index) => (
            <React.Fragment key={version.version}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleVersionSelect(version.version)}
                  sx={{ p: 2 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Versão {version.version}
                        </Typography>
                        {version.version === file.currentVersion && (
                          <Chip label="Atual" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {formatDate(version.createdAt)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Tamanho: {formatFileSize(version.sizeBytes)}
                          </Typography>
                          {version.pageCount && (
                            <Typography variant="caption" color="text.secondary">
                              Páginas: {version.pageCount}
                            </Typography>
                          )}
                          {version.generationTime && (
                            <Typography variant="caption" color="text.secondary">
                              Geração: {version.generationTime}s
                            </Typography>
                          )}
                        </Box>

                        {version.editPrompt && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Alterações:
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {version.editPrompt}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < availableVersions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {availableVersions.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma versão disponível
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};