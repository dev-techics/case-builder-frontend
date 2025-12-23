// features/auth/redux/authApi.ts

import axiosInstance from '@/api/axiosInstance';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../types/types';

// Helper function to get XSRF token from cookie
const getXsrfToken = (): string | null => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  return token ? decodeURIComponent(token) : null;
};

// Request interceptor to add XSRF token
axiosInstance.interceptors.request.use(config => {
  const token = getXsrfToken();

  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }

  return config;
});

// Response interceptor to handle CSRF token mismatch
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If we get a 419 (CSRF token mismatch) and haven't retried yet
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('CSRF token mismatch, fetching new token...');

      // Get a fresh CSRF cookie
      await axiosInstance.get('/sanctum/csrf-cookie');

      // Wait for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the new token
      const token = getXsrfToken();
      if (token) {
        originalRequest.headers['X-XSRF-TOKEN'] = token;
      }

      // Retry the original request
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  // Get CSRF cookie
  async getCsrfCookie(): Promise<void> {
    try {
      await axiosInstance.get('/sanctum/csrf-cookie');
      // Wait for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to get CSRF cookie:', error);
      throw error;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.getCsrfCookie();
    const { data } = await axiosInstance.post<AuthResponse>(
      '/api/login',
      credentials
    );
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    await this.getCsrfCookie();
    const { data } = await axiosInstance.post<AuthResponse>(
      '/api/register',
      credentials
    );
    return data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/api/logout');
  },

  async me(): Promise<{ user: any }> {
    const { data } = await axiosInstance.get<{ user: any }>('/api/me');
    return data;
  },
};
