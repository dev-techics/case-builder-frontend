import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type { Children, Tree } from '../redux/fileTreeSlice';

type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
};

type AxiosBaseQueryError = {
  status?: number;
  data?: unknown;
  message: string;
};

const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosBaseQueryError> =>
  async ({ url, method = 'get', data, params, headers }) => {
    try {
      const result = await axiosInstance.request({
        url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        },
      };
    }
  };

const fetchTree = async (bundleId: string): Promise<Tree> => {
  const response = await axiosInstance.get(`/api/bundles/${bundleId}/documents`);
  return response.data as Tree;
};

const toQueryError = (error: unknown): AxiosBaseQueryError => {
  const err = error as AxiosError;
  return {
    status: err.response?.status,
    data: err.response?.data,
    message: err.message,
  };
};

export const fileExplorerApi = createApi({
  reducerPath: 'fileExplorerApi',
  baseQuery: axiosBaseQuery(),
  endpoints: build => ({
    getFileTree: build.query<Tree, string | number>({
      query: bundleId => ({
        url: `/api/bundles/${bundleId}/documents`,
      }),
    }),
    deleteDocument: build.mutation<void, { documentId: string }>({
      query: ({ documentId }) => ({
        url: `/api/documents/${documentId}`,
        method: 'delete',
      }),
    }),
    renameDocument: build.mutation<
      void,
      {
        documentId: string;
        newName: string;
      }
    >({
      query: ({ documentId, newName }) => ({
        url: `/api/documents/${documentId}/rename`,
        method: 'patch',
        data: { name: newName },
      }),
    }),
    createFolder: build.mutation<
      Children,
      {
        bundleId: string;
        name: string;
        parentId?: string | null;
      }
    >({
      query: ({ bundleId, name, parentId }) => ({
        url: `/api/bundles/${bundleId}/documents`,
        method: 'post',
        data: {
          name,
          type: 'folder',
          parent_id: parentId ?? null,
        },
      }),
    }),
    reorderDocuments: build.mutation<
      { tree: Tree },
      {
        bundleId: string;
        items: Array<{ id: string; order: number }>;
      }
    >({
      async queryFn({ bundleId, items }) {
        try {
          await axiosInstance.post(`/api/bundles/${bundleId}/documents/reorder`, {
            items,
          });
          const tree = await fetchTree(String(bundleId));
          return { data: { tree } };
        } catch (error) {
          return { error: toQueryError(error) };
        }
      },
    }),
    moveDocument: build.mutation<
      { tree: Tree },
      {
        bundleId: string;
        documentId: string;
        newParentId: string | null;
      }
    >({
      async queryFn({ bundleId, documentId, newParentId }) {
        try {
          await axiosInstance.patch(`/api/documents/${documentId}/move`, {
            parent_id: newParentId,
          });
          const tree = await fetchTree(String(bundleId));
          return { data: { tree } };
        } catch (error) {
          return { error: toQueryError(error) };
        }
      },
    }),
    moveDocumentsBatch: build.mutation<
      { tree: Tree; skipApplyTree?: boolean },
      {
        bundleId: string;
        documentIds: string[];
        newParentId: string | null;
        skipApplyTree?: boolean;
      }
    >({
      async queryFn({ bundleId, documentIds, newParentId, skipApplyTree }) {
        try {
          for (const documentId of documentIds) {
            await axiosInstance.patch(`/api/documents/${documentId}/move`, {
              parent_id: newParentId,
            });
          }

          const tree = await fetchTree(String(bundleId));
          return { data: { tree, skipApplyTree } };
        } catch (error) {
          return { error: toQueryError(error) };
        }
      },
    }),
  }),
});

export const {
  useGetFileTreeQuery,
  useDeleteDocumentMutation,
  useRenameDocumentMutation,
  useCreateFolderMutation,
  useReorderDocumentsMutation,
  useMoveDocumentMutation,
  useMoveDocumentsBatchMutation,
} = fileExplorerApi;
