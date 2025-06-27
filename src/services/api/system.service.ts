import axios from 'axios';

// System service for health checks
// Note: These endpoints are not under /api prefix
const systemApi = axios.create({
  baseURL: 'http://localhost:3000',
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