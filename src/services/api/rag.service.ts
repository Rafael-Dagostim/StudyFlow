import api from './axiosConfig';

export interface RAGStatus {
  projectId: string;
  projectName: string;
  hasCollection: boolean;
  collectionName: string;
  totalDocuments: number;
  documentsWithText: number;
  processedDocuments: number;
  pendingProcessing: number;
  collectionStats: {
    name: string;
    vectorsCount: number;
    indexedVectorsCount: number;
    pointsCount: number;
    segmentsCount: number;
    status: string;
  };
  documents: DocumentAnalysis[];
  langChainSupported: number;
  totalWords: number;
  estimatedReadingTime: number;
  // Computed property for compatibility
  isReady: boolean;
}

export interface DocumentAnalysis {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  textContent?: string;
  processedAt: string | null;
  createdAt: string;
  isLangChainSupported: boolean;
  analysis?: {
    statistics: {
      words: number;
      characters: number;
      lines: number;
      paragraphs: number;
      readingTimeMinutes: number;
    };
    estimatedLanguage: string;
    complexity: string;
  };
  hasText: boolean;
  isProcessed: boolean;
  supportedByLangChain: boolean;
}

export const ragService = {
  // Trigger RAG processing for project documents
  processDocuments: (projectId: string) => {
    return api.post(`/chat/projects/${projectId}/rag/process`);
  },

  // Check RAG processing status
  getStatus: async (projectId: string) => {
    const response = await api.get(`/chat/projects/${projectId}/rag/status`);
    // Add computed isReady property based on actual backend logic
    const data = response.data;
    data.isReady = data.hasCollection && 
                   data.processedDocuments === data.totalDocuments && 
                   data.pendingProcessing === 0 &&
                   data.totalDocuments > 0;
    return response;
  },

  // Check if project is ready for chat
  isProjectReady: async (projectId: string): Promise<boolean> => {
    try {
      const response = await ragService.getStatus(projectId);
      return response.data.isReady;
    } catch (error) {
      return false;
    }
  }
};