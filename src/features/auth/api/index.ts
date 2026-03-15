/**
 * Authentication Api
 *
 * Responsibility: This file handles all auth api
 *
 * Author: Anik Dey
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AuthCredentials,
  AuthResponse,
  RegisterCredentials,
  User,
} from '../types/types';
import camelcaseKeys from 'camelcase-keys';

const BaseQuery = import.meta.env.VITE_BASE_URL;

const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseQuery,
    prepareHeaders: headers => {
      headers.set('accept', 'application/json');
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: build => ({
    /*---------------------
        Login Mutation
    -----------------------*/
    login: build.mutation<AuthResponse, AuthCredentials>({
      query: credentials => ({
        url: 'api/login',
        method: 'POST',
        body: credentials,
      }),

      // Transform snake_case response to camelCase
      transformResponse: (response: unknown): AuthResponse =>
        camelcaseKeys(response as object, { deep: true }) as AuthResponse,
    }),

    /*---------------------
        Register Mutation
    -----------------------*/
    register: build.mutation<AuthResponse, RegisterCredentials>({
      query: credentials => ({
        url: 'api/register',
        method: 'POST',
        body: credentials,
      }),

      // Transform snake_case response to camelCase
      transformResponse: (response: unknown): AuthResponse =>
        camelcaseKeys(response as object, { deep: true }) as AuthResponse,
    }),
    /*-----------------------
        Logout Mutation
    -------------------------*/
    logout: build.mutation<void, User>({
      query: (user: User) => ({
        url: '/api/logout',
        method: 'POST',
        body: user,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          localStorage.removeItem('access_token');
        }
      },
    }),
    /*-----------------------
        Fetch User Query
    ------------------------*/
    getUser: build.query<{ user: User }, void>({
      query: () => '/api/me',
      transformResponse: (response: unknown): { user: User } =>
        camelcaseKeys(response as object, { deep: true }) as { user: User },
    }),

    /*-----------------------
        Forgot Password Mutation
    ------------------------*/
    requestPasswordReset: build.mutation<
      { message?: string },
      { email: string }
    >({
      query: body => ({
        url: '/api/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    /*-----------------------
        Reset Password Mutation
    ------------------------*/
    resetPassword: build.mutation<
      { message: string },
      {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
      }
    >({
      query: body => ({
        url: '/api/reset-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetUserQuery,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} = authApi;
export default authApi;
