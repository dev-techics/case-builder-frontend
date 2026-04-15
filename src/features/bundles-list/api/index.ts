import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Bundle } from '../types/types';

const BaseQuery = import.meta.env.VITE_BASE_URL;

export const bundleListApi = createApi({
  reducerPath: 'bundleListApi',
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
    /*----------------------
        Fetch all bundles
    ------------------------*/
    getBundles: build.query<Bundle[], void>({
      query: () => `api/bundles`,
      transformResponse: (response: string) => {
        return response;
      },
    }),
  }),
});

export const { useGetBundlesQuery } = bundleListApi;
export default bundleListApi;
