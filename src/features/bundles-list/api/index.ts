import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Bundle, BundleStatus } from '../types';
import type { CreateBundleDto } from '../types';
import { toCreateBundlePayload } from '../types';
import {
  normalizeBundleListResponse,
  normalizeBundleResponse,
} from '../utils/normalizers';

const BASE_URL = import.meta.env.VITE_BASE_URL;

type RenameBundleRequest = {
  bundleId: string | number;
  name: string;
};

type UpdateBundleStatusRequest = {
  bundleId: string | number;
  status: BundleStatus;
};

const patchBundle = (
  draft: Bundle[],
  bundleId: string | number,
  updates: Partial<Pick<Bundle, 'name' | 'status'>>
) => {
  const bundle = draft.find(item => item.id === bundleId);

  if (bundle) {
    Object.assign(bundle, updates);
  }
};

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
        Rename an existing bundle
    ----------------------------*/
    renameBundle: build.mutation<void, RenameBundleRequest>({
      query: ({ bundleId, name }) => ({
        url: `/api/bundles/${bundleId}`,
        method: 'PATCH',
        body: { name },
      }),
      async onQueryStarted({ bundleId, name }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          bundleListApi.util.updateQueryData('getBundles', undefined, draft => {
            patchBundle(draft, bundleId, { name });
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [{ type: 'Bundle', id: 'LIST' }],
    }),

    /*------------------------------
        Update an existing status
    --------------------------------*/
    updateBundleStatus: build.mutation<void, UpdateBundleStatusRequest>({
      query: ({ bundleId, status }) => ({
        url: `/api/bundles/${bundleId}`,
        method: 'PATCH',
        body: { status },
      }),
      async onQueryStarted({ bundleId, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          bundleListApi.util.updateQueryData('getBundles', undefined, draft => {
            patchBundle(draft, bundleId, { status });
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { bundleId }) => [
        { type: 'Bundle', id: bundleId },
        { type: 'Bundle', id: 'LIST' },
      ],
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
  useRenameBundleMutation,
  useUpdateBundleStatusMutation,
  useDeleteBundleMutation,
} = bundleListApi;

export default bundleListApi;
