// API Diagnostics Utility
export class APIDiagnostics {
  static logRequest(url: string, method: string, data?: any) {
    console.group(`🔍 API Request: ${method} ${url}`);
    console.log('Time:', new Date().toISOString());
    if (data) {
      console.log('Payload size:', JSON.stringify(data).length, 'bytes');
      console.log('Data:', data);
    }
    console.groupEnd();
  }

  static logResponse(url: string, response: any, error?: any) {
    if (error) {
      console.group(`❌ API Error: ${url}`);
      console.error('Error type:', error.name);
      console.error('Error code:', error.code);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.message);
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.warn('🚨 This might be NS_ERROR_NET_RESET - Connection reset by server');
        console.info('💡 Possible solutions:');
        console.info('   1. Check backend server logs');
        console.info('   2. Reduce request payload size');
        console.info('   3. Increase server timeout');
        console.info('   4. Check for middleware interference');
      }
      console.groupEnd();
    } else {
      console.group(`✅ API Success: ${url}`);
      console.log('Status:', response.status);
      console.log('Response size:', JSON.stringify(response.data).length, 'bytes');
      console.groupEnd();
    }
  }

  static async testConnection(baseUrl: string = 'http://localhost:3000') {
    console.group('🔧 API Connection Test');
    
    try {
      // Test 1: Health check
      console.log('1. Testing health endpoint...');
      const healthResponse = await fetch(`${baseUrl}/health`);
      console.log('Health check:', healthResponse.ok ? '✅' : '❌');
      
      // Test 2: CORS preflight
      console.log('2. Testing CORS...');
      const corsResponse = await fetch(`${baseUrl}/api/auth/signin`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });
      console.log('CORS preflight:', corsResponse.ok ? '✅' : '❌');
      
      // Test 3: Simple API call
      console.log('3. Testing API endpoint...');
      try {
        const apiResponse = await fetch(`${baseUrl}/api/projects`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        console.log('API call (expect 401):', apiResponse.status === 401 ? '✅' : '❌');
      } catch (e) {
        console.log('API call failed:', e);
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
    }
    
    console.groupEnd();
  }
}

export default APIDiagnostics;