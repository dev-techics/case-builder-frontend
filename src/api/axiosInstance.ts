import axios from 'axios';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // If unauthorized (401), clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Optionally redirect to login
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
