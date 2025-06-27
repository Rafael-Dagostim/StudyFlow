import api from './axiosConfig';

// Service for WebSocket connection information
export const websocketInfoService = {
  // Get WebSocket connection details
  getConnectionInfo: () =>
    api.get('/websocket/connection-info'),

  // Get WebSocket usage guide
  getGuide: () =>
    api.get('/websocket/guide')
};