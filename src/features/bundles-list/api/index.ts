import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Bundle } from '../types';
import type { CreateBundleDto } from '../types';
import { toCreateBundlePayload } from '../types';
import {
  normalizeBundleListResponse,
  normalizeBundleResponse,
} from '../utils/normalizers';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const bundleListApi = createApi({
  reducerPath: 'bundleListApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: headers => {
      headers.set('accept', 'application/json');
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Bundle'],
  endpoints: build => ({
    /*----------------------
        Fetch all bundles
    ------------------------*/
    getBundles: build.query<Bundle[], void>({
      query: () => '/api/bundles',
      transformResponse: normalizeBundleListResponse,
      providesTags: result =>
        result
          ? [
              { type: 'Bundle', id: 'LIST' },
              ...result.map(bundle => ({
                type: 'Bundle' as const,
                id: bundle.id,
              })),
            ]
          : [{ type: 'Bundle', id: 'LIST' }],
    }),

    /*--------------------------
        Fetch a single bundle
    ----------------------------*/
    getBundleById: build.query<Bundle, string | number>({
      query: bundleId => `/api/bundles/${bundleId}`,
      transformResponse: normalizeBundleResponse,
      providesTags: (_result, _error, bundleId) => [
        { type: 'Bundle', id: bundleId },
      ],
    }),

    /*--------------------------
        Create a new bundle
    ----------------------------*/
    createBundle: build.mutation<Bundle, CreateBundleDto>({
      query: bundleData => ({
        url: '/api/bundles',
        method: 'POST',
        body: toCreateBundlePayload(bundleData),
      }),
      transformResponse: normalizeBundleResponse,
      invalidatesTags: [{ type: 'Bundle', id: 'LIST' }],
    }),

    /*--------------------------
        Delete an existing bundle
    ----------------------------*/
    deleteBundle: build.mutation<void, string | number>({
      query: bundleId => ({
        url: `/api/bundles/${bundleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, bundleId) => [
        { type: 'Bundle', id: bundleId },
        { type: 'Bundle', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBundlesQuery,
  useGetBundleByIdQuery,
  useLazyGetBundleByIdQuery,
  useCreateBundleMutation,
  useDeleteBundleMutation,
} = bundleListApi;

export default bundleListApi;
