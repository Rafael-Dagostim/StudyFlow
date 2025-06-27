import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  LinearProgress,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import { generatedFilesService } from '../services/api/generatedFiles.service';
import type { FileType, CreateFileRequest, EditFileRequest, GeneratedFile, GenerationStatus } from '../types/types';

interface FileModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  mode: 'create' | 'edit';
  file?: GeneratedFile;
  onSuccess: (fileId: string) => void;
}

export const FileModal: React.FC<FileModalProps> = ({
  open,
  onClose,
  projectId,
  mode,
  file,
  onSuccess
}) => {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFileTypes, setLoadingFileTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  
  // Form data for create mode
  const [createFormData, setCreateFormData] = useState<CreateFileRequest>({
    prompt: '',
    displayName: '',
    fileType: '',
    format: 'pdf',
    options: {
      language: 'pt',
      difficulty: 'intermediate',
      includeImages: false
    }
  });

  // Form data for edit mode
  const [editFormData, setEditFormData] = useState<EditFileRequest>({
    editPrompt: '',
    baseVersion: 1
  });

  // Load file types when modal opens
  useEffect(() => {
    if (open && mode === 'create') {
      const loadFileTypes = async () => {
        setLoadingFileTypes(true);
        try {
          const response = await generatedFilesService.getFileTypes(projectId);
          setFileTypes(response.data.data.fileTypes);
        } catch (err) {
          setError('Erro ao carregar tipos de arquivo');
        } finally {
          setLoadingFileTypes(false);
        }
      };
      loadFileTypes();
    }
  }, [open, projectId, mode]);

  // Initialize edit form data
  useEffect(() => {
    if (open && mode === 'edit' && file) {
      setEditFormData({
        editPrompt: '',
        baseVersion: file.currentVersion
      });
    }
  }, [open, mode, file]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCreateFormData({
        prompt: '',
        displayName: '',
        fileType: '',
        format: 'pdf',
        options: {
          language: 'pt',
          difficulty: 'intermediate',
          includeImages: false
        }
      });
      setEditFormData({
        editPrompt: '',
        baseVersion: 1
      });
      setError(null);
      setGenerationStatus(null);
    }
  }, [open]);

  const selectedFileType = fileTypes.find(ft => ft.id === createFormData.fileType);

  const handleCreateSubmit = async () => {
    if (!createFormData.prompt.trim() || !createFormData.displayName.trim() || !createFormData.fileType) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generatedFilesService.createFile(projectId, createFormData);
      const fileData = response.data.data;

      // File creation initiated successfully
      // The actual generation happens in background with WebSocket updates
      setGenerationStatus({
        fileId: fileData.id || fileData.fileId,
        version: fileData.version || fileData.currentVersion || 1,
        status: 'processing' as const,
        generationTime: 0,
        sizeBytes: 0
      });

      // Close modal immediately since generation is async
      onSuccess(fileData.id || fileData.fileId);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editFormData.editPrompt.trim() || !file) {
      setError('Por favor, descreva as alterações desejadas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generatedFilesService.editFile(projectId, file.id, editFormData);
      const { version } = response.data.data;

      // File edit initiated successfully
      // The actual generation happens in background with WebSocket updates
      setGenerationStatus({
        fileId: file.id,
        version: version,
        status: 'processing' as const,
        generationTime: 0,
        sizeBytes: 0
      });

      // Close modal immediately since generation is async
      onSuccess(file.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao editar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'create') {
      handleCreateSubmit();
    } else {
      handleEditSubmit();
    }
  };

  const getProgressText = () => {
    if (!generationStatus) return '';
    
    switch (generationStatus.status) {
      case 'processing':
        return 'Gerando arquivo...';
      case 'completed':
        return 'Arquivo gerado com sucesso!';
      case 'failed':
        return 'Falha na geração do arquivo';
      default:
        return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: mode === 'create' ? 600 : 400 }
      }}
    >
      <DialogTitle>
        {mode === 'create' ? 'Novo Arquivo' : 'Editar Arquivo'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {generationStatus && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {getProgressText()}
              {generationStatus.generationTime && (
                <> • Tempo: {generationStatus.generationTime}s</>
              )}
            </Typography>
          </Box>
        )}

        {mode === 'create' && (
          <>
            {loadingFileTypes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tipo de Arquivo</InputLabel>
                  <Select
                    value={createFormData.fileType}
                    label="Tipo de Arquivo"
                    onChange={(e) => setCreateFormData(prev => ({ 
                      ...prev, 
                      fileType: e.target.value,
                      format: 'pdf' // Reset format when type changes
                    }))}
                    disabled={loading}
                  >
                    {fileTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedFileType && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedFileType.description}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  label="Nome do Arquivo"
                  value={createFormData.displayName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  sx={{ mb: 2 }}
                  disabled={loading}
                />

                {selectedFileType && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Formato</InputLabel>
                    <Select
                      value={createFormData.format}
                      label="Formato"
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, format: e.target.value }))}
                      disabled={loading}
                    >
                      {selectedFileType.formats.map(format => (
                        <MenuItem key={format} value={format}>
                          {format.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Prompt de Geração"
                  value={createFormData.prompt}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Descreva o que você quer gerar..."
                  sx={{ mb: 2 }}
                  disabled={loading}
                />

                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Opções Avançadas</Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Idioma</InputLabel>
                    <Select
                      value={createFormData.options?.language}
                      label="Idioma"
                      onChange={(e) => setCreateFormData(prev => ({
                        ...prev,
                        options: { ...prev.options, language: e.target.value as 'en' | 'pt' }
                      }))}
                      disabled={loading}
                    >
                      <MenuItem value="pt">Português</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Dificuldade</InputLabel>
                    <Select
                      value={createFormData.options?.difficulty}
                      label="Dificuldade"
                      onChange={(e) => setCreateFormData(prev => ({
                        ...prev,
                        options: { ...prev.options, difficulty: e.target.value as any }
                      }))}
                      disabled={loading}
                    >
                      <MenuItem value="basic">Básico</MenuItem>
                      <MenuItem value="intermediate">Intermediário</MenuItem>
                      <MenuItem value="advanced">Avançado</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={createFormData.options?.includeImages || false}
                      onChange={(e) => setCreateFormData(prev => ({
                        ...prev,
                        options: { ...prev.options, includeImages: e.target.checked }
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Incluir imagens"
                />
              </>
            )}
          </>
        )}

        {mode === 'edit' && file && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Arquivo:</strong> {file.displayName}
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Versão Base</InputLabel>
              <Select
                value={editFormData.baseVersion}
                label="Versão Base"
                onChange={(e) => setEditFormData(prev => ({ ...prev, baseVersion: Number(e.target.value) }))}
                disabled={loading}
              >
                {file.versions
                  .filter(v => v.hasContent)
                  .sort((a, b) => b.version - a.version)
                  .map(version => (
                    <MenuItem key={version.version} value={version.version}>
                      v{version.version}
                      {version.version === file.currentVersion && ' (atual)'}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="O que você quer alterar?"
              value={editFormData.editPrompt}
              onChange={(e) => setEditFormData(prev => ({ ...prev, editPrompt: e.target.value }))}
              placeholder="Ex: Adicionar mais exemplos, tornar mais simples, incluir exercícios práticos..."
              disabled={loading}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading ||
            (mode === 'create' && (!createFormData.prompt.trim() || !createFormData.displayName.trim() || !createFormData.fileType)) ||
            (mode === 'edit' && !editFormData.editPrompt.trim())
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Gerando...' : mode === 'create' ? 'Gerar' : 'Criar Nova Versão'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};