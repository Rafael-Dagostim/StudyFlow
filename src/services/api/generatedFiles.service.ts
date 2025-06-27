import api from "./axiosConfig";

export interface GeneratedFile {
  id: string;
  fileName: string;
  displayName: string;
  fileType: "study-guide" | "quiz" | "summary" | "lesson-plan" | "custom";
  format: "pdf" | "markdown" | "docx";
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  versions: FileVersion[];
}

export interface FileVersion {
  version: number;
  createdAt: string;
  sizeBytes: number;
  pageCount?: number;
  editPrompt?: string;
  hasContent: boolean;
  generationTime?: number;
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
  fileType: string;
  format: string;
  options?: {
    language?: "en" | "pt";
    difficulty?: "basic" | "intermediate" | "advanced";
    includeImages?: boolean;
  };
}

export interface EditFileRequest {
  editPrompt: string;
  baseVersion?: number;
}

export interface GenerationStatus {
  fileId: string;
  version: number;
  status: "processing" | "completed" | "failed";
  generationTime?: number;
  sizeBytes?: number;
  pageCount?: number;
  downloadUrl?: string;
  error?: string;
}

export const generatedFilesService = {
  // Get available file types
  getFileTypes: (projectId: string) => {
    console.log("[GeneratedFiles] Getting file types for project:", projectId);
    return api
      .get(`/projects/${projectId}/generated-files/types`)
      .then((response: any) => {
        console.log("[GeneratedFiles] File types retrieved:", response.data);
        return response;
      })
      .catch((error: any) => {
        console.error("[GeneratedFiles] Error getting file types:", error);
        throw error;
      });
  },

  // Create a new file
  createFile: (projectId: string, request: CreateFileRequest) => {
    console.log(
      "[GeneratedFiles] Creating file for project:",
      projectId,
      "with request:",
      request
    );
    return api
      .post(`/projects/${projectId}/generated-files`, request)
      .then((response: any) => {
        console.log("[GeneratedFiles] File creation response:", response.data);
        return response;
      })
      .catch((error: any) => {
        console.error("[GeneratedFiles] Error creating file:", error);
        console.error("[GeneratedFiles] Request details:", {
          projectId,
          request,
        });
        throw error;
      });
  },

  // Edit an existing file (create new version)
  editFile: (projectId: string, fileId: string, request: EditFileRequest) => {
    console.log(
      "[GeneratedFiles] Editing file:",
      fileId,
      "for project:",
      projectId,
      "with request:",
      request
    );
    return api
      .post(
        `/projects/${projectId}/generated-files/${fileId}/versions`,
        request
      )
      .then((response: any) => {
        console.log("[GeneratedFiles] File edit response:", response.data);
        return response;
      })
      .catch((error: any) => {
        console.error("[GeneratedFiles] Error editing file:", error);
        console.error("[GeneratedFiles] Edit details:", {
          projectId,
          fileId,
          request,
        });
        throw error;
      });
  },

  // List all files in a project
  listFiles: (projectId: string) => {
    console.log("[GeneratedFiles] Listing files for project:", projectId);
    return api
      .get(`/projects/${projectId}/generated-files`)
      .then((response: any) => {
        console.log("[GeneratedFiles] Files listed:", response.data);
        return response;
      })
      .catch((error: any) => {
        console.error("[GeneratedFiles] Error listing files:", error);
        throw error;
      });
  },

  // Get file details
  getFileDetails: (projectId: string, fileId: string) => {
    console.log(
      "[GeneratedFiles] Getting details for file:",
      fileId,
      "in project:",
      projectId
    );
    return api
      .get(`/projects/${projectId}/generated-files/${fileId}`)
      .then((response: any) => {
        console.log("[GeneratedFiles] File details:", response.data);
        return response;
      })
      .catch((error: any) => {
        console.error("[GeneratedFiles] Error getting file details:", error);
        throw error;
      });
  },

  // Check generation status
  getGenerationStatus: (
    projectId: string,
    fileId: string,
    version?: number
  ) => {
    const versionParam = version ? `?version=${version}` : "";
    console.log(
      "[GeneratedFiles] Getting generation status for file:",
      fileId,
      "version:",
      version
    );
    return api
      .get(
        `/projects/${projectId}/generated-files/${fileId}/status${versionParam}`
      )
      .then((response: any) => {
        console.log("[GeneratedFiles] Generation status:", response.data);
        return response;
      })
      .catch((error: any) => {
        console.error(
          "[GeneratedFiles] Error getting generation status:",
          error
        );
        throw error;
      });
  },

  // Download file
  downloadFile: async (
    projectId: string,
    fileId: string,
    version?: number
  ): Promise<Blob> => {
    const versionParam = version ? `?version=${version}` : "";
    console.log(
      "[GeneratedFiles] Downloading file:",
      fileId,
      "version:",
      version,
      "for project:",
      projectId
    );
    try {
      const response = await api.get(
        `/projects/${projectId}/generated-files/${fileId}/download${versionParam}`,
        {
          responseType: "blob",
        }
      );
      console.log(
        "[GeneratedFiles] Download successful, blob size:",
        response.data.size
      );
      return response.data;
    } catch (error) {
      console.error("[GeneratedFiles] Error downloading file:", error);
      console.error("[GeneratedFiles] Download details:", {
        projectId,
        fileId,
        version,
      });
      throw error;
    }
  },

  // Get HTML content for PDF generation
  getHTMLContent: async (
    projectId: string,
    fileId: string,
    version?: number
  ): Promise<string> => {
    const versionParam = version ? `?version=${version}` : "";
    console.log(
      "[GeneratedFiles] Getting HTML content for file:",
      fileId,
      "version:",
      version
    );
    try {
      const response = await api.get(
        `/projects/${projectId}/generated-files/${fileId}/html${versionParam}`,
        {
          responseType: "text",
        }
      );
      console.log(
        "[GeneratedFiles] HTML content retrieved, length:",
        response.data.length
      );
      return response.data;
    } catch (error) {
      console.error("[GeneratedFiles] Error getting HTML content:", error);
      throw error;
    }
  },

  // Delete file
  deleteFile: (projectId: string, fileId: string) => {
    console.log(
      "[GeneratedFiles] Deleting file:",
      fileId,
      "from project:",
      projectId
    );
    return api
      .delete(`/projects/${projectId}/generated-files/${fileId}`)
      .then((response: any) => {
        console.log("[GeneratedFiles] File deleted successfully");
        return response;
      })
      .catch((error: any) => {
        console.error("[GeneratedFiles] Error deleting file:", error);
        throw error;
      });
  },

  // Poll for generation completion
  pollGenerationStatus: async (
    projectId: string,
    fileId: string,
    version?: number,
    onProgress?: (status: GenerationStatus) => void
  ): Promise<GenerationStatus> => {
    console.log(
      "[GeneratedFiles] Starting polling for file:",
      fileId,
      "version:",
      version
    );
    const poll = async (): Promise<GenerationStatus> => {
      const response = await generatedFilesService.getGenerationStatus(
        projectId,
        fileId,
        version
      );
      const status = response.data.data;

      console.log("[GeneratedFiles] Poll result:", status);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === "completed" || status.status === "failed") {
        console.log(
          "[GeneratedFiles] Polling completed with status:",
          status.status
        );
        return status;
      }

      // Wait 2 seconds before next poll
      console.log("[GeneratedFiles] Continuing polling, waiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return poll();
    };

    return poll();
  },
};
