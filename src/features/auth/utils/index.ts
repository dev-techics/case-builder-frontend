import type { ErrorResponse } from '../types/types';

export const getErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (typeof error === 'string') return error;

  if (typeof error === 'object' && error !== null) {
    if ('data' in error) {
      const data = (error as { data?: unknown }).data;
      if (typeof data === 'string') return data;
      if (typeof data === 'object' && data !== null) {
        const response = data as ErrorResponse & { error?: string };
        if (typeof response.message === 'string') return response.message;
        if (typeof response.error === 'string') return response.error;
        if (response.errors) {
          const firstError = Object.values(response.errors).flat()[0];
          if (typeof firstError === 'string') return firstError;
        }
      }
    }

    if (
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message?: string }).message ?? 'Login failed';
    }
  }

  return 'Login failed';
};

/*----------------------------------------------------
    return true/false if user is authenticated or not
------------------------------------------------------*/
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};
