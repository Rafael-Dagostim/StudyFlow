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
    editPrompt: "",
    baseVersion: undefined,
  });

  // Load file types when modal opens
  useEffect(() => {
    if (open && mode === "create") {
      const loadFileTypes = async () => {
        setLoadingFileTypes(true);
        try {
          const response = await generatedFilesService.getFileTypes(projectId);
          // Extract fileTypes from nested response structure
          const typesData = response.data?.data?.fileTypes || [];
          setFileTypes(typesData);
        } catch (err) {
          console.error("Error loading file types:", err);
          setError("Erro ao carregar tipos de arquivo");
          setFileTypes([]); // Set default empty array
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
      setEditFormData({
        editPrompt: "",
        baseVersion: file.currentVersion,
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
        editPrompt: "",
        baseVersion: undefined,
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
      const fileData = response.data?.data;

      // File creation initiated successfully
      // The actual generation happens in background with WebSocket updates
      setGenerationStatus({
        fileId: fileData.fileId,
        version: fileData.version || 1,
        status: "processing" as const,
        generationTime: 0,
        sizeBytes: 0,
      });

      // Close modal immediately since generation is async
      onSuccess(fileData.fileId);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar arquivo");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editFormData.editPrompt.trim() || !file) {
      setError("Por favor, descreva as alterações desejadas");
      return;
    }

    // Validate edit prompt length (10-1000 characters)
    if (
      editFormData.editPrompt.length < 10 ||
      editFormData.editPrompt.length > 1000
    ) {
      setError("O prompt de edição deve ter entre 10 e 1000 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generatedFilesService.createVersion(
        projectId,
        file.id,
        editFormData
      );
      const versionData = response.data?.data;
      const version = versionData?.version || (file.currentVersion + 1);

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
                value={editFormData.baseVersion || file.currentVersion || ""}
                label="Versão Base"
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    baseVersion: Number(e.target.value),
                  }))
                }
                disabled={loading}
              >
                {file.versions
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <MenuItem key={version.version} value={version.version}>
                      v{version.version}
                      {version.version === file.currentVersion && " (atual)"}
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
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  editPrompt: e.target.value,
                }))
              }
              placeholder="Ex: Adicionar mais exemplos, tornar mais simples, incluir exercícios práticos..."
              helperText={`${editFormData.editPrompt.length}/1000 caracteres (mínimo 10)`}
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
            (mode === "edit" && (!editFormData.editPrompt.trim() ||
              editFormData.editPrompt.length < 10 ||
              editFormData.editPrompt.length > 1000))
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
