// src/types/types.ts

// --- Tipos de Formulário (usados no frontend) ---
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// --- Modelos de Dados da API ---

// Usuário (Professor) - Tipagem para loggedInUser e lista geral de usuários
export interface User {
  id: string; // ID único do usuário/professor
  name: string; // Nome completo do professor (usado na API)
  email: string;
  password: string; // Lembre-se: em um app real, a senha seria hashed/criptografada
  phone?: string; // Telefone, pode ser opcional
  firstName?: string; // Primeiro nome (para separar fullName no frontend)
  lastName?: string;  // Sobrenome (para separar fullName no frontend)
}


// Projeto
export interface Project {
  id: string;
  name: string; // O nome do projeto na API
  subject: string;
  description: string;
  professorId: string; // No backend, o dono do projeto é professorId
  authorId: string; // No frontend, usamos authorId para vincular ao User.id logado
  author: string; // Nome completo do autor/professor
  createdAt: string; // Data de criação (ISO string)
  updatedAt?: string; // Data de última atualização (ISO string)

  // Propriedades do seu modelo local que podem ser mapeadas da API ou adicionadas:
  status: 'Rascunho' | 'Em andamento' | 'Concluído'; // Status do projeto
  summary: string; // Resumo do projeto
  avatarColor: string; // Cor do avatar associada ao projeto
  attachedFileNames?: string[]; // Nomes dos arquivos anexados (se múltiplos)
}

// Documento
export interface IDocument {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  projectId: string; // ID do projeto ao qual pertence
  createdAt: string; // Data de upload
  updatedAt?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // Status de processamento LangChain
  processingResult?: {
    success: boolean;
    chunksProcessed?: number;
    processingTime?: number;
    error?: string;
  };
  analysisResult?: any; // Resultado de análise LangChain, se houver
}

// Mensagem de Chat
export interface IMessage {
  id: string;
  role: 'USER' | 'ASSISTANT'; // Quem enviou a mensagem
  content: string; // Conteúdo da mensagem
  createdAt: string; // Timestamp
  metadata?: {
    tokensUsed?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  fileName?: string; // Para anexos no chat (lado do frontend)
  timestamp?: string; // Timestamp formatado para exibição no frontend
}

// Conversa de Chat
export interface IConversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

// Fonte (do RAG)
export interface ISource {
  documentId: string;
  filename: string;
  content: string;
  score: number;
  chunkIndex: number;
}


// --- Interfaces para Requisições e Respostas da API ---

// Resposta Padrão da API (geralmente usada para encapsular dados)
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// Autenticação
export interface ISignUpRequest {
  name: string;
  email: string;
  password: string;
}

// Data esperada na resposta de sucesso do signup
export interface ISignUpResponseData {
  professor: User; // O tipo User é mais abrangente para professor
  accessToken: string;
  refreshToken: string;
}

export interface ISignInRequest {
  email: string;
  password: string;
}

// Data esperada na resposta de sucesso do signin
export interface ISignInResponseData {
  accessToken: string;
  refreshToken: string;
  professor: User;
}

// Data esperada na resposta do profile GET
export interface IProfileResponseData {
  professor: User;
}

export interface IUpdateProfileRequest {
  name?: string; // Nome pode ser atualizado
  email?: string; // Email pode ser atualizado
  password?: string; // Senha pode ser atualizada
  // Adicionar aqui se phone, firstName, lastName etc. puderem ser atualizados pela API
}

export interface IUpdateProfileResponseData {
  professor: User;
}

// Requisição de renovação de token
export interface IRefreshTokenRequest {
  refreshToken: string;
}

// Resposta de renovação de token
export interface IRefreshTokenResponseData {
  accessToken: string;
}

// Gestão de Projetos
export interface ICreateProjectRequest {
  name: string;
  subject: string;
  description: string;
}

export interface ICreateProjectResponseData {
  id: string;
  name: string;
  subject: string;
  description: string;
  professorId: string; // ID do professor que criou o projeto
  createdAt: string;
}

export interface IUpdateProjectRequest {
  name?: string;
  subject?: string;
  description?: string;
}

// Gestão de Documentos (respostas de upload)
export interface IUploadDocumentsResponseData {
  uploaded: number;
  failed: number;
  results: Array<{
    filename: string;
    success: boolean;
    document?: IDocument; // Documento criado, se sucesso
    processResult?: { // Resultado do processamento LangChain
      success: boolean;
      chunksProcessed?: number;
      processingTime?: number;
      error?: string;
    };
  }>;
}

export interface IListDocumentsResponseData {
  documents: IDocument[];
}

export interface IProcessDocumentResponseData {
  document: IDocument;
  processResult: {
    success: boolean;
    chunksProcessed?: number;
    processingTime?: number;
    error?: string;
  };
}


// Chat com IA (RAG)
export interface IStartConversationRequest {
  projectId: string;
  message: string;
  title: string;
}

export interface IStartConversationResponseData {
  conversation: IConversation;
  messages: IMessage[]; // Mensagens iniciais da conversa (USER e ASSISTANT)
  sources?: ISource[]; // Fontes RAG, se houver
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface IContinueConversationRequest {
  conversationId: string;
  message: string;
}

export interface IContinueConversationResponseData {
  message: IMessage; // A nova mensagem (ASSISTANT) gerada
  sources?: ISource[];
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface IGetConversationResponseData {
  conversation: IConversation;
  messages: IMessage[];
  sources?: ISource[];
}

export interface IListConversationsResponseData {
  conversations: IConversation[];
}

export interface IUpdateConversationRequest {
  title: string;
}

export interface IUpdateConversationResponseData {
  conversation: IConversation;
}

// Generated Files


export interface FileType {
  id: string;
  name: string;
  description: string;
  formats: string[];
}


export interface GenerationStatus {
  fileId: string;
  version: number;
  status: 'processing' | 'completed' | 'failed';
  generationTime?: number;
  sizeBytes?: number;
  pageCount?: number;
  downloadUrl?: string;
  error?: string;
}

// Sistema RAG
export interface IRagStatusResponseData {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  documentsProcessed: number; // Quantos documentos foram processados para RAG
  totalDocuments: number; // Total de documentos no projeto
  lastProcessedAt?: string;
  error?: string; // Se houve erro no processamento
}

export interface IProcessRagDocumentsResponseData {
  message: string;
  data: {
    processedDocuments: number;
    failedDocuments: number;
  };
}

export interface IRagHealthResponseData {
  status: 'OK' | 'ERROR';
  message: string;
  dependencies: {
    openAI: 'OK' | 'ERROR';
    qdrant: 'OK' | 'ERROR';
    langChain: 'OK' | 'ERROR';
  };
}

// Monitoramento do Sistema
export interface IApiStatusResponse {
  status: 'OK' | 'ERROR';
  message: string;
  timestamp: string;
  environment: string;
}