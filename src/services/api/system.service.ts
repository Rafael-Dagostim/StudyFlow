import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';

// System service for health checks
// Note: These endpoints are not under /api prefix
const systemApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const systemService = {
  // API health check
  checkHealth: () =>
    systemApi.get('/health'),

  // WebSocket status and connected clients
  getWebSocketStatus: () =>
    systemApi.get('/ws-status')
};