import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_URL } from '../constants/api';

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  title: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSource {
  documentId: string;
  filename: string;
  content: string;
  score: number;
}

export interface ChatStatus {
  status: 'processing' | 'completed' | 'error';
  stage: 'validating' | 'conversation' | 'memory' | 'embedding' | 'search' | 'generating' | 'saving';
  message: string;
}

export interface StreamChunk {
  content: string;
  fullContent: string;
}

export interface StreamComplete {
  messageId: string;
  content: string;
  tokensUsed: number;
  sources: DocumentSource[];
}

export interface FileGenerationUpdate {
  fileId: string;
  version: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  errorMessage?: string;
  timestamp: string;
}

export interface WebSocketEvents {
  // Client to Server
  'chat:start': {
    projectId: string;
    message: string;
    conversationId?: string;
  };
  'chat:get-conversations': {
    projectId: string;
  };
  'chat:get-messages': {
    conversationId: string;
  };

  // Server to Client
  'chat:status': ChatStatus;
  'chat:stream-start': {
    sources: DocumentSource[];
  };
  'chat:stream-chunk': StreamChunk;
  'chat:stream-complete': StreamComplete;
  'chat:user-message': {
    message: ChatMessage;
  };
  'chat:conversation-created': {
    conversationId: string;
    title: string;
  };
  'chat:conversations': {
    conversations: Conversation[];
  };
  'chat:messages': {
    conversation: {
      id: string;
      title: string;
      projectId: string;
      project: any;
      messages: ChatMessage[];
    };
  };
  'chat:error': {
    error: string;
  };
  'file-generation-update': FileGenerationUpdate;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(baseUrl: string = WEBSOCKET_URL): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      this.socket = io(baseUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
      });

      // Set up automatic reconnection handling
      this.socket.on('reconnect', (attemptNumber) => {
      });

      this.socket.on('reconnect_error', (error) => {
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event emission methods
  startChat(data: WebSocketEvents['chat:start']): void {
    this.emit('chat:start', data);
  }

  getConversations(projectId: string): void {
    this.emit('chat:get-conversations', { projectId });
  }

  getMessages(conversationId: string): void {
    this.emit('chat:get-messages', { conversationId });
  }

  // Event listening methods
  onStatus(callback: (data: ChatStatus) => void): () => void {
    return this.on('chat:status', callback);
  }

  onStreamStart(callback: (data: { sources: DocumentSource[] }) => void): () => void {
    return this.on('chat:stream-start', callback);
  }

  onStreamChunk(callback: (data: StreamChunk) => void): () => void {
    return this.on('chat:stream-chunk', callback);
  }

  onStreamComplete(callback: (data: StreamComplete) => void): () => void {
    return this.on('chat:stream-complete', callback);
  }

  onUserMessage(callback: (data: { message: ChatMessage }) => void): () => void {
    return this.on('chat:user-message', callback);
  }

  onConversationCreated(callback: (data: { conversationId: string; title: string }) => void): () => void {
    return this.on('chat:conversation-created', callback);
  }

  onConversations(callback: (data: { conversations: Conversation[] }) => void): () => void {
    return this.on('chat:conversations', callback);
  }

  onMessages(callback: (data: { conversation: any }) => void): () => void {
    return this.on('chat:messages', callback);
  }

  onError(callback: (data: { error: string }) => void): () => void {
    return this.on('chat:error', callback);
  }

  onFileGenerationUpdate(callback: (data: FileGenerationUpdate) => void): () => void {
    return this.on('file-generation-update', callback);
  }

  // Generic event handlers
  private emit<K extends keyof WebSocketEvents>(event: K, data: WebSocketEvents[K]): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit(event, data);
  }

  private on<K extends keyof WebSocketEvents>(
    event: K,
    callback: (data: WebSocketEvents[K]) => void
  ): () => void {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on(event as string, callback);
    
    // Store the listener for cleanup
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, []);
    }
    this.listeners.get(event as string)!.push(callback);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.off(event as string, callback);
      }
      const eventListeners = this.listeners.get(event as string);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();