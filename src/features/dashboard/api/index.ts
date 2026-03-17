import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import camelcaseKeys from 'camelcase-keys';
import type { DashboardStats } from '../types/types';

const BaseQuery = import.meta.env.VITE_BASE_URL;

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseQuery,
    prepareHeaders: headers => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: build => ({
    /*--------------------------
        Get stats query
    ----------------------------*/
    getStats: build.query<DashboardStats, void>({
      query: () => '/api/stats',
      transformResponse: (response: unknown): DashboardStats =>
        camelcaseKeys(response as object, { deep: true }) as DashboardStats,
    }),
  }),
});

export const { useGetStatsQuery } = dashboardApi;
