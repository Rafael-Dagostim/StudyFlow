import api from './axiosConfig';

export const documentsService = {
  // Upload documents to a project
  uploadDocuments: (projectId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return api.post(`/projects/${projectId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Get all documents for a project
  getDocuments: (projectId: string) =>
    api.get(`/projects/${projectId}/documents`),

  // Get a specific document
  getDocument: (projectId: string, documentId: string) =>
    api.get(`/projects/${projectId}/documents/${documentId}`),

  // Delete a document
  deleteDocument: (projectId: string, documentId: string) =>
    api.delete(`/projects/${projectId}/documents/${documentId}`),

  // Download a document
  downloadDocument: async (projectId: string, documentId: string): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};