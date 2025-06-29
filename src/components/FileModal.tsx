import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  CreateFileRequest,
  EditFileRequest,
  GeneratedFile,
  generatedFilesService,
} from "../services/api/generatedFiles.service";
import type { FileType, GenerationStatus } from "../types/types";

interface FileModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  mode: "create" | "edit";
  file?: GeneratedFile;
  onSuccess: (fileId: string) => void;
}

export const FileModal: React.FC<FileModalProps> = ({
  open,
  onClose,
  projectId,
  mode,
  file,
  onSuccess,
}) => {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFileTypes, setLoadingFileTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus | null>(null);

  // Form data for create mode
  const [createFormData, setCreateFormData] = useState<CreateFileRequest>({
    prompt: "",
    displayName: "",
    fileType: "custom" as const,
    format: "pdf",
  });

  // Form data for edit mode
  const [editFormData, setEditFormData] = useState<EditFileRequest>({
    fileId: "",
    changes: "",
    versionId: undefined,
  });

  // Load file types when modal opens
  useEffect(() => {
    if (open && mode === "create") {
      const loadFileTypes = async () => {
        setLoadingFileTypes(true);
        try {
          const response = await generatedFilesService.getFileTypes(projectId);
          setFileTypes(response.data.data.fileTypes);
        } catch (err) {
          setError("Erro ao carregar tipos de arquivo");
        } finally {
          setLoadingFileTypes(false);
        }
      };
      loadFileTypes();
    }
  }, [open, projectId, mode]);

  // Initialize edit form data
  useEffect(() => {
    if (open && mode === "edit" && file) {
      const currentVersionObj =
        file.versions.find((v) => v.isCurrent) ||
        file.versions[file.versions.length - 1];
      setEditFormData({
        fileId: file.id,
        changes: "",
        versionId: currentVersionObj?.id,
      });
    }
  }, [open, mode, file]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCreateFormData({
        prompt: "",
        displayName: "",
        fileType: "custom" as const,
        format: "pdf",
      });
      setEditFormData({
        fileId: "",
        changes: "",
        versionId: undefined,
      });
      setError(null);
      setGenerationStatus(null);
    }
  }, [open]);

  const selectedFileType = fileTypes.find(
    (ft) => ft.id === createFormData.fileType
  );

  const handleCreateSubmit = async () => {
    // Validate required fields
    if (!createFormData.prompt.trim()) {
      setError("Por favor, preencha o prompt de geração");
      return;
    }
    if (!createFormData.displayName.trim()) {
      setError("Por favor, preencha o nome do arquivo");
      return;
    }
    if (!createFormData.fileType) {
      setError("Por favor, selecione o tipo de arquivo");
      return;
    }
    // Validate prompt length (10-2000 characters)
    if (
      createFormData.prompt.length < 10 ||
      createFormData.prompt.length > 2000
    ) {
      setError("O prompt deve ter entre 10 e 2000 caracteres");
      return;
    }
    // Validate display name length (1-100 characters)
    if (
      createFormData.displayName.length < 1 ||
      createFormData.displayName.length > 100
    ) {
      setError("O nome do arquivo deve ter entre 1 e 100 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generatedFilesService.createFile(
        projectId,
        createFormData
      );
      const fileData = response.data.data;

      // File creation initiated successfully
      // The actual generation happens in background with WebSocket updates
      setGenerationStatus({
        fileId: fileData.id || fileData.fileId,
        version: fileData.version || fileData.currentVersion || 1,
        status: "processing" as const,
        generationTime: 0,
        sizeBytes: 0,
      });

      // Close modal immediately since generation is async
      onSuccess(fileData.id || fileData.fileId);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar arquivo");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editFormData.changes.trim() || !file) {
      setError("Por favor, descreva as alterações desejadas");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generatedFilesService.editFile(
        projectId,
        editFormData
      );
      const { version } = response.data.data;

      // File edit initiated successfully
      // The actual generation happens in background with WebSocket updates
      setGenerationStatus({
        fileId: file.id,
        version: version,
        status: "processing" as const,
        generationTime: 0,
        sizeBytes: 0,
      });

      // Close modal immediately since generation is async
      onSuccess(file.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao editar arquivo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "create") {
      handleCreateSubmit();
    } else {
      handleEditSubmit();
    }
  };

  const getProgressText = () => {
    if (!generationStatus) return "";

    switch (generationStatus.status) {
      case "processing":
        return "Gerando arquivo...";
      case "completed":
        return "Arquivo gerado com sucesso!";
      case "failed":
        return "Falha na geração do arquivo";
      default:
        return "";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: mode === "create" ? 600 : 400 },
      }}
    >
      <DialogTitle>
        {mode === "create" ? "Novo Arquivo" : "Editar Arquivo"}
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

        {mode === "create" && (
          <>
            {loadingFileTypes ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                  <InputLabel>Tipo de Arquivo</InputLabel>
                  <Select
                    value={createFormData.fileType}
                    label="Tipo de Arquivo"
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        fileType: e.target
                          .value as CreateFileRequest["fileType"],
                        format: "pdf", // Reset format when type changes
                      }))
                    }
                    disabled={loading}
                  >
                    {fileTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedFileType && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {selectedFileType.description}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  label="Nome do Arquivo"
                  value={createFormData.displayName}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  helperText={`${createFormData.displayName.length}/100 caracteres`}
                  sx={{ mb: 2 }}
                  disabled={loading}
                />

                {selectedFileType && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Formato</InputLabel>
                    <Select
                      value={createFormData.format}
                      label="Formato"
                      onChange={(e) =>
                        setCreateFormData((prev) => ({
                          ...prev,
                          format: e.target.value,
                        }))
                      }
                      disabled={loading}
                    >
                      {selectedFileType.formats.map((format) => (
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
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      prompt: e.target.value,
                    }))
                  }
                  placeholder="Descreva o que você quer gerar..."
                  helperText={`${createFormData.prompt.length}/2000 caracteres (mínimo 10)`}
                  sx={{ mb: 2 }}
                  disabled={loading}
                />
              </>
            )}
          </>
        )}

        {mode === "edit" && file && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Arquivo:</strong> {file.name}
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Versão Base</InputLabel>
              <Select
                value={editFormData.versionId || ""}
                label="Versão Base"
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    versionId: e.target.value,
                  }))
                }
                disabled={loading}
              >
                {file.versions
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <MenuItem key={version.id} value={version.id}>
                      v{version.version}
                      {version.isCurrent && " (atual)"}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="O que você quer alterar?"
              value={editFormData.changes}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  changes: e.target.value,
                }))
              }
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
            (mode === "create" &&
              (!createFormData.prompt.trim() ||
                !createFormData.displayName.trim() ||
                !createFormData.fileType ||
                createFormData.prompt.length < 10 ||
                createFormData.prompt.length > 2000 ||
                createFormData.displayName.length < 1 ||
                createFormData.displayName.length > 100)) ||
            (mode === "edit" && !editFormData.changes.trim())
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading
            ? "Gerando..."
            : mode === "create"
            ? "Gerar"
            : "Criar Nova Versão"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
