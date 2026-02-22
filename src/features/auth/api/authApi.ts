import axiosInstance from '@/api/axiosInstance';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from '../types/types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>(
      '/api/login',
      credentials
    );

    // Store token in localStorage
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }

    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>(
      '/api/register',
      credentials
    );

    // Store token in localStorage
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }

    return data;
  },

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/api/logout');
    } finally {
      // Always remove token from localStorage, even if API call fails
      localStorage.removeItem('access_token');
    }
  },

  async me(): Promise<{ user: User }> {
    const { data } = await axiosInstance.get<{ user: User }>('/api/me');
    return data;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await axiosInstance.post('/api/forgot-password', { email });
  },

  async resetPassword(
    email: string,
    token: string,
    password: string,
    password_confirmation: string
  ): Promise<{ message: string }> {
    const response = await axiosInstance.post('/api/reset-password', {
      token,
      email,
      password,
      password_confirmation,
    });

    return response.data;
  },

  // Helper to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  // Helper to get token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
};
