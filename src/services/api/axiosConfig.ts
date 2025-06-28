// src/services/api/axiosConfig.ts

import axios from 'axios'; // <-- Import just axios

// Caminho correto para o seu 'types.ts' (já estava certo)
import { ApiResponse, IRefreshTokenRequest, IRefreshTokenResponseData } from '../../types/types';

// URL Base da sua API, conforme a documentação
// Use relative URLs in development to leverage proxy, absolute URLs in production
const API_BASE_URL = process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:3000/api';
// URL Base para rotas que não estão sob /api (ex: /health)
const API_ROOT_URL = process.env.NODE_ENV === 'development' ? '' : 'http://localhost:3000';

let isRefreshing = false; // Flag para evitar múltiplas requisições de refresh de token
let failedRequestsQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []; // Fila de requisições falhas

// --- Funções para Gerenciar Tokens no localStorage (mantidas) ---
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const TokenManager = {
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('loggedInUser');
  },
};

// --- Instância Axios Principal (para rotas API) ---
const api: any = axios.create({ // Using any type
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Additional configuration to handle connection issues
  validateStatus: (status) => status < 500, // Don't throw for 4xx errors
});

// --- Instância Axios Separada para Refresh Token ---
const refreshApi: any = axios.create({ // Using any type
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor de Requisição ---
api.interceptors.request.use(
  (config: any) => { // Use any for now to avoid type issues
    const accessToken = TokenManager.getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: any) => { // Use any for now
    return Promise.reject(error);
  }
);

// --- Interceptor de Resposta ---
api.interceptors.response.use(
  (response: any) => response, // Using any type
  async (error: any) => { // Use any for now
    // Enhanced error logging
    if (error.code === 'ECONNRESET' || error.code === 'NETWORK_ERROR' || 
        error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK')) {
      
      // Retry logic for network errors (but not for auth requests)
      const originalRequest = error.config as any;
      if (originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
        originalRequest._retry = true;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return api(originalRequest);
      }
    }
    const originalRequest = error.config as any; // Use any for config

    if (error.response?.status === 401 && originalRequest && originalRequest.url !== '/auth/refresh') {
      const refreshToken = TokenManager.getRefreshToken();

      if (!refreshToken || isRefreshing) {
        TokenManager.clearTokens();
        localStorage.removeItem('loggedInUser');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      isRefreshing = true;
      const retryOriginalRequest = new Promise((resolve, reject) => {
        failedRequestsQueue.push({ resolve, reject });
      });

      try {
        const response = await refreshApi.post('/auth/refresh', {
          refreshToken,
        } as IRefreshTokenRequest);

        const newAccessToken = response.data.data.accessToken;
        TokenManager.setAccessToken(newAccessToken);

        failedRequestsQueue.forEach(p => p.resolve(newAccessToken));
        failedRequestsQueue = [];
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        // Para retentar a requisição original, use a instância padrão do axios
        // ou a instância 'api' se o interceptor já tiver adicionado o header
        return axios(originalRequest);
      } catch (refreshError: any) {
        console.error('Erro ao renovar token:', refreshError);
        TokenManager.clearTokens();
        localStorage.removeItem('loggedInUser');
        window.location.href = '/login';
        failedRequestsQueue.forEach(p => p.reject(refreshError));
        failedRequestsQueue = [];
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// --- Instância Axios para rotas fora de /api (ex: /health) ---
export const rootApi: any = axios.create({ // Using any type
  baseURL: API_ROOT_URL,
  timeout: 15000,
});