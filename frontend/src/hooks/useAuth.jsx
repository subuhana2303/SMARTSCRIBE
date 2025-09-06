const { createContext, useContext, useState, useEffect } = React;
import { api } from '../lib/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      const userData = response.data;
      setUser(userData);
      
      if (userData.access_token) {
        localStorage.setItem('token', userData.access_token);
        setToken(userData.access_token);
      }
      
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName
      });
      
      const userData = response.data;
      setUser(userData);
      
      if (userData.access_token) {
        localStorage.setItem('token', userData.access_token);
        setToken(userData.access_token);
      }
      
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
