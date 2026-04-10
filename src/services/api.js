const API_BASE_URL = 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const apiClient = {
  async request(method, path, data = null) {
    const options = {
      method,
      headers: getAuthHeaders()
    };
    
    const traceId = localStorage.getItem('traceId');
    if (traceId) {
      options.headers['X-Trace-ID'] = traceId;
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    return response.json();
  },
   
  get(path) {
    return this.request('GET', path);
  },
   
  post(path, data) {
    return this.request('POST', path, data);
  }
};

export const getTraceById = async (traceId) => {
  return apiClient.get(`/api/traces/trace/${traceId}`);
};

export const getTracesByService = async (serviceName, startDate, endDate) => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  return apiClient.get(`/api/traces/service/${serviceName}?${params}`);
};

export const getSlowTraces = async (threshold = 1000) => {
  return apiClient.get(`/api/traces/slow?threshold=${threshold}`);
};

export const getErrorTraces = async () => {
  return apiClient.get('/api/traces/errors');
};

export const getTracesByProcess = async (processId) => {
  return apiClient.get(`/api/traces/process/${processId}`);
};

export const getStats = async (serviceName, startDate, endDate) => {
  const params = new URLSearchParams({
    serviceName,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  return apiClient.get(`/api/traces/stats?${params}`);
};

export const getHealth = async () => {
  return apiClient.get('/health');
};

export const simulateDelay = async (seconds) => {
  return apiClient.post('/api/traces/test/delay', { seconds });
};

export const simulateStatus = async (statusCode) => {
  return apiClient.post('/api/traces/test/status', { statusCode });
};

export const testProxy = async (url) => {
  return apiClient.post('/api/traces/test/proxy', { url });
};

export default apiClient;
