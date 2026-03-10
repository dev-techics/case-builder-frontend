// features/auth/types.ts

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Authentication response returned from the login endpoint.
 *
 * @property `user` - Authenticated user details
 * @property `accessToken` - JWT access token for API authentication
 * @property `tokenType` - Token type used in Authorization header
 * @property `message` - Optional message from the backend
 */
export interface AuthResponse {
  user: User;
  message?: string;
  accessToken: string; // Add this
  tokenType: string;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
