import type { FileTree, ServerFileTreeNode } from '../types/fileTree';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BaseQuery = import.meta.env.VITE_BASE_URL;

type RotateDocumentApiResponse = {
  document?: {
    url?: string;
  };
};

type MergeDocumentsMutationResponse = {
  tree: FileTree;
  mergedDocumentId?: string;
  mergedDocumentName?: string;
};

type MergeDocumentRecord = {
  id?: string | number;
  name?: string;
};

type MergeDocumentsApiResponse = {
  document?: MergeDocumentRecord;
  mergedDocument?: MergeDocumentRecord;
  tree?: FileTree;
  data?: {
    document?: MergeDocumentRecord;
    mergedDocument?: MergeDocumentRecord;
    tree?: FileTree;
  };
};

const parseTextResponse = (response: unknown) => {
  if (typeof response !== 'string') {
    return response;
  }

  try {
    return JSON.parse(response);
  } catch {
    return response;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getMergeDocumentMetadata = (
  response: unknown
): Pick<
  MergeDocumentsMutationResponse,
  'mergedDocumentId' | 'mergedDocumentName'
> => {
  if (!isRecord(response)) {
    return {};
  }

  const nestedData = isRecord(response.data) ? response.data : null;
  const documentCandidate = [
    response.document,
    response.mergedDocument,
    nestedData?.document,
    nestedData?.mergedDocument,
  ].find(isRecord);

  if (!documentCandidate) {
    return {};
  }

  return {
    mergedDocumentId:
      typeof documentCandidate.id === 'string' ||
      typeof documentCandidate.id === 'number'
        ? String(documentCandidate.id)
        : undefined,
    mergedDocumentName:
      typeof documentCandidate.name === 'string'
        ? documentCandidate.name
        : undefined,
  };
};

const getTreeFromMergeResponse = (response: unknown): FileTree | null => {
  if (!isRecord(response)) {
    return null;
  }

  if (isRecord(response.tree)) {
    return response.tree as unknown as FileTree;
  }

  if (isRecord(response.data) && isRecord(response.data.tree)) {
    return response.data.tree as unknown as FileTree;
  }

  return null;
};

export const fileTreeApi = createApi({
  reducerPath: 'fileTreeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseQuery,
    credentials: 'include',
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
        Get file tree
    ----------------------------*/
    getTree: build.query<FileTree, string | number>({
      query: bundleId => `/api/bundles/${bundleId}/documents`,
    }),

    /*--------------------------
        Delete document
    ----------------------------*/
    deleteDocument: build.mutation<
      { documentId: string },
      { documentId: string }
    >({
      query: ({ documentId }) => ({
        url: `/api/documents/${documentId}`,
        method: 'DELETE',
      }),
      transformResponse: (_response, _meta, arg) => ({
        documentId: arg.documentId,
      }),
    }),

    /*--------------------------
        Rename document
    ----------------------------*/
    renameDocument: build.mutation<
      { id: string; newName: string },
      { documentId: string; newName: string }
    >({
      query: ({ documentId, newName }) => ({
        url: `/api/documents/${documentId}/rename`,
        method: 'PATCH',
        body: { name: newName },
      }),
      transformResponse: (_response, _meta, arg) => ({
        id: arg.documentId,
        newName: arg.newName,
      }),
    }),

    /*--------------------------
        Rotate document
    ----------------------------*/
    rotateDocument: build.mutation<
      { documentId: string; rotation: number; documentUrl?: string },
      { documentId: string; rotation: number; bundleId?: string }
    >({
      query: ({ documentId, rotation, bundleId }) => ({
        url: `/api/documents/${documentId}/rotate`,
        method: 'POST',
        body: { rotation, bundle_id: bundleId },
      }),
      transformResponse: (
        response: RotateDocumentApiResponse | undefined,
        _meta,
        arg
      ) => ({
        documentId: arg.documentId,
        rotation: arg.rotation,
        documentUrl: response?.document?.url,
      }),
    }),

    /*--------------------------
        Create folder
    ----------------------------*/
    createFolder: build.mutation<
      ServerFileTreeNode,
      { bundleId: string; name: string; parentId?: string | null }
    >({
      query: ({ bundleId, name, parentId }) => ({
        url: `/api/bundles/${bundleId}/documents`,
        method: 'POST',
        body: {
          name,
          type: 'folder',
          parent_id: parentId,
        },
      }),
    }),

    /*--------------------------
        Upload files mutation
    ----------------------------*/
    uploadFiles: build.mutation<
      | {
          documents: Array<{
            id: string | number;
            parentId: string | null;
            name: string;
            type: string;
            url: string;
          }>;
          conversionStatuses?: unknown[];
        }
      | string,
      {
        bundleId: string;
        formData: FormData;
      }
    >({
      query: ({ bundleId, formData }) => ({
        url: `/api/bundles/${bundleId}/documents/upload`,
        method: 'POST',
        body: formData,
        responseHandler: 'text',
      }),
      transformResponse: (response: string) => {
        try {
          return JSON.parse(response);
        } catch {
          return response;
        }
      },
    }),

    /*--------------------------
        Reorder documents
    ----------------------------*/
    reorderDocuments: build.mutation<
      { bundleId: string; tree: FileTree },
      { bundleId: string; items: Array<{ id: string; order: number }> }
    >({
      async queryFn({ bundleId, items }, _api, _extraOptions, baseQuery) {
        const reorderResult = await baseQuery({
          url: `/api/bundles/${bundleId}/documents/reorder`,
          method: 'POST',
          body: { items },
        });

        if ('error' in reorderResult) {
          return { error: reorderResult.error as FetchBaseQueryError };
        }

        const treeResult = await baseQuery(
          `/api/bundles/${bundleId}/documents`
        );

        if ('error' in treeResult) {
          return { error: treeResult.error as FetchBaseQueryError };
        }

        return { data: { bundleId, tree: treeResult.data as FileTree } };
      },
    }),

    /*--------------------------
        Move document
    ----------------------------*/
    moveDocument: build.mutation<
      { tree: FileTree },
      { bundleId: string; documentId: string; newParentId: string | null }
    >({
      async queryFn(
        { bundleId, documentId, newParentId },
        _api,
        _extraOptions,
        baseQuery
      ) {
        const moveResult = await baseQuery({
          url: `/api/documents/${documentId}/move`,
          method: 'PATCH',
          body: { parent_id: newParentId },
        });

        if ('error' in moveResult) {
          return { error: moveResult.error as FetchBaseQueryError };
        }

        const treeResult = await baseQuery(
          `/api/bundles/${bundleId}/documents`
        );

        if ('error' in treeResult) {
          return { error: treeResult.error as FetchBaseQueryError };
        }

        return { data: { tree: treeResult.data as FileTree } };
      },
    }),

    /*--------------------------
        Move documents batch
    ----------------------------*/
    moveDocumentsBatch: build.mutation<
      { tree: FileTree; skipApplyTree?: boolean },
      {
        bundleId: string;
        documentIds: string[];
        newParentId: string | null;
        skipApplyTree?: boolean;
      }
    >({
      async queryFn(
        { bundleId, documentIds, newParentId, skipApplyTree },
        _api,
        _extraOptions,
        baseQuery
      ) {
        for (const documentId of documentIds) {
          const moveResult = await baseQuery({
            url: `/api/documents/${documentId}/move`,
            method: 'PATCH',
            body: { parent_id: newParentId },
          });

          if ('error' in moveResult) {
            return { error: moveResult.error as FetchBaseQueryError };
          }
        }

        const treeResult = await baseQuery(
          `/api/bundles/${bundleId}/documents`
        );

        if ('error' in treeResult) {
          return { error: treeResult.error as FetchBaseQueryError };
        }

        return {
          data: { tree: treeResult.data as FileTree, skipApplyTree },
        };
      },
    }),

    /*--------------------------
        Merge documents
    ----------------------------*/
    mergeDocuments: build.mutation<
      MergeDocumentsMutationResponse,
      {
        bundleId: string;
        documentIds: string[];
        name: string;
        parentId: string | null;
      }
    >({
      async queryFn(
        { bundleId, documentIds, name, parentId },
        _api,
        _extraOptions,
        baseQuery
      ) {
        const mergeResult = await baseQuery({
          url: `/api/bundles/${bundleId}/documents/merge`,
          method: 'POST',
          body: {
            document_ids: documentIds,
            name,
            parent_id: parentId,
          },
          responseHandler: 'text',
        });

        if ('error' in mergeResult) {
          return { error: mergeResult.error as FetchBaseQueryError };
        }

        const mergeResponse = parseTextResponse(mergeResult.data) as
          | MergeDocumentsApiResponse
          | string;
        const mergeMetadata = getMergeDocumentMetadata(mergeResponse);
        const responseTree = getTreeFromMergeResponse(mergeResponse);

        if (responseTree) {
          return {
            data: {
              tree: responseTree,
              ...mergeMetadata,
            },
          };
        }

        const treeResult = await baseQuery(
          `/api/bundles/${bundleId}/documents`
        );

        if ('error' in treeResult) {
          return { error: treeResult.error as FetchBaseQueryError };
        }

        return {
          data: {
            tree: treeResult.data as FileTree,
            ...mergeMetadata,
          },
        };
      },
    }),
  }),
});

export const {
  useCreateFolderMutation,
  useDeleteDocumentMutation,
  useGetTreeQuery,
  useMergeDocumentsMutation,
  useMoveDocumentMutation,
  useMoveDocumentsBatchMutation,
  useRenameDocumentMutation,
  useReorderDocumentsMutation,
  useRotateDocumentMutation,
  useUploadFilesMutation,
} = fileTreeApi;
