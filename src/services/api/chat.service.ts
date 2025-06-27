import api from './axiosConfig';

// Chat service for HTTP-based conversation management
// Note: Actual chat messaging is handled via WebSocket
export const chatService = {
  // Create a new conversation
  createConversation: (data: { projectId: string; title: string }) =>
    api.post('/chat/conversations', data),

  // Get conversation history
  getConversation: (conversationId: string) =>
    api.get(`/chat/conversations/${conversationId}`),

  // List conversations for a project
  getProjectConversations: (projectId: string) =>
    api.get(`/chat/projects/${projectId}/conversations`),

  // Update conversation (e.g., title)
  updateConversation: (conversationId: string, data: { title: string }) =>
    api.put(`/chat/conversations/${conversationId}`, data),

  // Delete a conversation
  deleteConversation: (conversationId: string) =>
    api.delete(`/chat/conversations/${conversationId}`),

  // Get RAG processing status for a project
  getRAGStatus: (projectId: string) =>
    api.get(`/chat/projects/${projectId}/rag/status`),

  // Process unprocessed documents for RAG
  processRAG: (projectId: string) =>
    api.post(`/chat/projects/${projectId}/rag/process`),

  // Check RAG system health
  getRAGHealth: () =>
    api.get('/chat/rag/health')
};