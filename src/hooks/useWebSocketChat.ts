import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  webSocketService, 
  ChatMessage, 
  Conversation, 
  DocumentSource, 
  ChatStatus,
  StreamChunk,
  StreamComplete 
} from '../services/websocket.service';

export interface UseWebSocketChatState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentStatus: ChatStatus | null;
  messages: ChatMessage[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  sources: DocumentSource[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

export interface UseWebSocketChatActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: string, conversationId?: string) => void;
  loadConversations: (projectId: string) => void;
  loadConversation: (conversationId: string) => void;
  clearError: () => void;
  clearMessages: () => void;
}

export interface UseWebSocketChatReturn extends UseWebSocketChatState, UseWebSocketChatActions {}

export function useWebSocketChat(projectId: string, enabled: boolean = true): UseWebSocketChatReturn {
  const [state, setState] = useState<UseWebSocketChatState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    currentStatus: null,
    messages: [],
    conversations: [],
    currentConversation: null,
    sources: [],
    isStreaming: false,
    streamingContent: '',
    error: null,
  });

  const cleanupFunctions = useRef<Array<() => void>>([]);
  const currentStreamingMessage = useRef<string>('');

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) return;

    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));

    try {
      await webSocketService.connect();
      
      // Set up event listeners
      const cleanups = [
        webSocketService.onStatus((data) => {
          setState(prev => ({ ...prev, currentStatus: data }));
        }),

        webSocketService.onStreamStart((data) => {
          setState(prev => ({ 
            ...prev, 
            isStreaming: true, 
            sources: data.sources,
            streamingContent: ''
          }));
          currentStreamingMessage.current = '';
        }),

        webSocketService.onStreamChunk((data) => {
          currentStreamingMessage.current = data.fullContent;
          setState(prev => ({ 
            ...prev, 
            streamingContent: data.fullContent 
          }));
        }),

        webSocketService.onStreamComplete((data) => {
          const assistantMessage: ChatMessage = {
            id: data.messageId,
            role: 'ASSISTANT',
            content: data.content,
            createdAt: new Date().toISOString(),
            metadata: {
              tokensUsed: data.tokensUsed,
              sources: data.sources
            }
          };

          setState(prev => ({ 
            ...prev, 
            messages: [...prev.messages, assistantMessage],
            isStreaming: false,
            streamingContent: '',
            sources: data.sources,
            currentStatus: { status: 'completed', stage: 'saving', message: 'Response completed!' }
          }));
          currentStreamingMessage.current = '';
        }),

        webSocketService.onUserMessage((data) => {
          setState(prev => ({ 
            ...prev, 
            messages: [...prev.messages, data.message]
          }));
        }),

        webSocketService.onConversationCreated((data) => {
          const newConversation: Conversation = {
            id: data.conversationId,
            title: data.title,
            projectId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setState(prev => ({ 
            ...prev, 
            currentConversation: newConversation,
            conversations: [newConversation, ...prev.conversations]
          }));
        }),

        webSocketService.onConversations((data) => {
          setState(prev => ({ 
            ...prev, 
            conversations: data.conversations 
          }));
        }),

        webSocketService.onMessages((data) => {
          setState(prev => ({ 
            ...prev, 
            messages: data.conversation.messages,
            currentConversation: {
              id: data.conversation.id,
              title: data.conversation.title,
              projectId: data.conversation.projectId,
              createdAt: data.conversation.createdAt || new Date().toISOString(),
              updatedAt: data.conversation.updatedAt || new Date().toISOString()
            }
          }));
        }),

        webSocketService.onError((data) => {
          setState(prev => ({ 
            ...prev, 
            error: data.error,
            isStreaming: false,
            currentStatus: { status: 'error', stage: 'generating', message: data.error }
          }));
        })
      ];

      cleanupFunctions.current = cleanups;

      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        isConnecting: false, 
        connectionError: null 
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        connectionError: errorMessage,
        error: errorMessage
      }));
    }
  }, [state.isConnected, state.isConnecting, projectId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clean up event listeners
    cleanupFunctions.current.forEach(cleanup => cleanup());
    cleanupFunctions.current = [];

    webSocketService.disconnect();
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false,
      currentStatus: null,
      isStreaming: false,
      streamingContent: ''
    }));
  }, []);

  // Send a message
  const sendMessage = useCallback((message: string, conversationId?: string) => {
    if (!state.isConnected) {
      setState(prev => ({ ...prev, error: 'Not connected to WebSocket' }));
      return;
    }

    // Just set the status, don't add the message optimistically
    // The server will send it back via onUserMessage
    setState(prev => ({ 
      ...prev, 
      error: null,
      currentStatus: { status: 'processing', stage: 'validating', message: 'Sending message...' }
    }));

    webSocketService.startChat({
      projectId,
      message,
      conversationId: conversationId || state.currentConversation?.id
    });
  }, [state.isConnected, state.currentConversation, projectId]);

  // Load conversations for the project
  const loadConversations = useCallback((projectId: string) => {
    if (!state.isConnected) return;
    webSocketService.getConversations(projectId);
  }, [state.isConnected]);

  // Load a specific conversation
  const loadConversation = useCallback((conversationId: string) => {
    if (!state.isConnected) return;
    setState(prev => ({ ...prev, messages: [] })); // Clear current messages
    webSocketService.getMessages(conversationId);
  }, [state.isConnected]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, connectionError: null }));
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      messages: [], 
      currentConversation: null,
      sources: [],
      streamingContent: '',
      isStreaming: false,
      currentStatus: null
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-connect when component mounts (only if enabled)
  useEffect(() => {
    if (enabled && !state.isConnected && !state.isConnecting && !state.connectionError) {
      connect();
    }
  }, [connect, state.isConnected, state.isConnecting, state.connectionError, enabled]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    loadConversations,
    loadConversation,
    clearError,
    clearMessages,
  };
}