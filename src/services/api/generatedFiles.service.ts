import api from "./axiosConfig";

export interface GeneratedFile {
  id: string;
  fileName: string;
  displayName: string;
  fileType: string;
  format: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  versions: FileVersion[];
  // Legacy fields for backward compatibility
  name?: string;
  type?: string;
  path?: string;
  content?: string;
  htmlContent?: string;
  projectId?: string;
  generationStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export interface FileVersion {
  id?: string;
  version: number;
  createdAt: string;
  sizeBytes: number;
  pageCount: number;
  generationTime: number;
  editPrompt?: string | null;
  hasContent: boolean;
  // Legacy fields for backward compatibility
  content?: string;
  htmlContent?: string;
  isCurrent?: boolean;
  metadata?: {
    prompt?: string;
    changes?: string;
  };
}

export interface FileType {
  id: string;
  name: string;
  description: string;
  formats: string[];
}

export interface CreateFileRequest {
  prompt: string;
  displayName: string;
  fileType: "study-guide" | "quiz" | "summary" | "lesson-plan" | "custom";
  format: "pdf" | "markdown";
}

export interface EditFileRequest {
  fileId: string;
  changes: string;
  versionId?: string;
}

export const generatedFilesService = {
  // Get available file types
  getFileTypes: (projectId: string) => {
    return api
      .get(`/projects/${projectId}/generated-files/types`)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // Create a new file
  createFile: (projectId: string, request: CreateFileRequest) => {
    return api
      .post(`/projects/${projectId}/generated-files`, request)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // Edit an existing file to create a new version
  editFile: (projectId: string, request: EditFileRequest) => {
    return api
      .post(`/projects/${projectId}/generated-files/edit`, request)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // List all files for a project
  listFiles: (projectId: string) => {
    return api
      .get(`/projects/${projectId}/generated-files`)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // Get a specific file with all its versions
  getFileDetails: (projectId: string, fileId: string) => {
    return api
      .get(`/projects/${projectId}/generated-files/${fileId}`)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // Get generation status for a file
  getGenerationStatus: (projectId: string, fileId: string) => {
    return api
      .get(`/projects/${projectId}/generated-files/${fileId}/status`)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // Download a file version as blob for PDF generation
  downloadFile: async (projectId: string, fileId: string, version?: number) => {
    try {
      const versionParam = version !== undefined ? `?version=${version}` : "";
      const response = await api.get(
        `/projects/${projectId}/generated-files/${fileId}/download${versionParam}`,
        { responseType: "blob" }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get HTML content for PDF generation
  getHTMLContent: async (
    projectId: string,
    fileId: string,
    version?: number
  ) => {
    try {
      const versionParam = version !== undefined ? `?version=${version}` : "";
      const response = await api.get(
        `/projects/${projectId}/generated-files/${fileId}/html${versionParam}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete a file
  deleteFile: (projectId: string, fileId: string) => {
    return api
      .delete(`/projects/${projectId}/generated-files/${fileId}`)
      .then((response: any) => {
        return response;
      })
      .catch((error: any) => {
        throw error;
      });
  },

  // Poll for generation status with callback for progress updates
  pollGenerationStatus: async (
    projectId: string,
    fileId: string,
    onProgress?: (status: string) => void
  ): Promise<GeneratedFile> => {
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await api.get(
          `/projects/${projectId}/generated-files/${fileId}/status`
        );
        const file: GeneratedFile = response.data;

        if (onProgress && file.generationStatus) {
          onProgress(file.generationStatus);
        }

        if (file.generationStatus === "COMPLETED") {
          return file;
        }

        if (file.generationStatus === "FAILED") {
          throw new Error("Falha na geração");
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error("Tempo limite da geração excedido");
  },
};
