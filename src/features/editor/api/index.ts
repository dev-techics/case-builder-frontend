import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BaseQuery = import.meta.env.VITE_BASE_URL;

type RotateDocumentApiResponse = {
  document?: {
    url?: string;
  };
};

type RotateDocumentPageResponse = {
  documentId: string;
  pageNumber: number;
  documentUrl?: string;
};

type RotateDocumentPageRequest = {
  bundleId: string;
  documentId: string;
  pageNumber: number;
  rotation?: number;
};

export const editorApi = createApi({
  reducerPath: 'editorApi',
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
    rotateDocumentPage: build.mutation<
      RotateDocumentPageResponse,
      RotateDocumentPageRequest
    >({
      query: ({ bundleId, documentId, pageNumber, rotation }) => ({
        url: `/api/documents/${documentId}/rotate`,
        method: 'POST',
        body: {
          bundle_id: bundleId,
          document_id: documentId,
          page_number: pageNumber,
          rotation,
        },
      }),
      transformResponse: (
        response: RotateDocumentApiResponse | undefined,
        _meta,
        arg
      ) => ({
        documentId: arg.documentId,
        pageNumber: arg.pageNumber,
        documentUrl: response?.document?.url,
      }),
    }),
  }),
});

export const { useRotateDocumentPageMutation } = editorApi;
