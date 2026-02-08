import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Automatically detect the correct API URL based on platform
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If running on Android emulator, use special IP
  if (Capacitor.getPlatform() === 'android') {
    // 10.0.2.2 is Android emulator's alias for host machine's localhost
    return 'http://10.0.2.2:5000/api';
  }

  // For iOS simulator or web, use localhost or env variable
  return envUrl || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and language
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const language = localStorage.getItem('language') || 'ar';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Accept-Language header for backend
    config.headers['Accept-Language'] = language;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip redirect for login endpoint - let the Login page handle 401 errors itself
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
