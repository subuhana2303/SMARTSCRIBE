import { useAuth } from '../hooks/useAuth.jsx';

// Base API configuration
const API_BASE_URL = window.location.origin + '/api';

// Create axios-like API client
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(method, url, data = null, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add body for POST/PUT requests
    if (data && method.toUpperCase() !== 'GET') {
      if (data instanceof FormData) {
        delete config.headers['Content-Type']; // Let browser set boundary for FormData
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const error = new Error(responseData.detail || responseData || `HTTP ${response.status}`);
        error.response = {
          status: response.status,
          data: responseData
        };
        throw error;
      }

      return {
        data: responseData,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        error.response = {
          status: 0,
          data: { detail: 'Network error - please check your connection' }
        };
      }
      throw error;
    }
  }

  async get(url, options = {}) {
    return this.request('GET', url, null, options);
  }

  async post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }

  async put(url, data, options = {}) {
    return this.request('PUT', url, data, options);
  }

  async delete(url, options = {}) {
    return this.request('DELETE', url, null, options);
  }
}

// Create and export API instance
export const api = new ApiClient();

// Request interceptor for automatic token handling
const originalRequest = api.request.bind(api);
api.request = async function(method, url, data, options) {
  try {
    return await originalRequest(method, url, data, options);
  } catch (error) {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear stored token
      localStorage.removeItem('token');
      
      // Redirect to auth page if not already there
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    throw error;
  }
};

export default api;
