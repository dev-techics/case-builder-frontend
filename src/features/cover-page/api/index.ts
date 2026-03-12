import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Template } from '../types';

const BASE_URL = import.meta.env.VITE_BASE_URL;

type CoverPagePayload = {
  templateKey?: string;
  values?: Record<string, unknown>;
  html?: string;
  lexicalJson?: string | null;
  type?: 'front' | 'back';
  name?: string;
  description?: string;
  isDefault?: boolean;
};

type BundleMetadataPayload = {
  front_cover_page_id?: string | null;
  back_cover_page_id?: string | null;
};

const stripUndefined = <T extends Record<string, unknown>>(payload: T) => {
  const cleaned = { ...payload };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

const toSnakeCoverPagePayload = (data: CoverPagePayload) =>
  stripUndefined({
    template_key: data.templateKey,
    values: data.values,
    html_content: data.html,
    lexical_json: data.lexicalJson,
    type: data.type,
    name: data.name,
    description: data.description,
    is_default: data.isDefault,
  });

const normalizeTemplate = (payload: unknown): Template => {
  const template = (payload ?? {}) as Template & {
    html_content?: string;
    lexical_json?: string | null;
    template_key?: string;
    is_default?: boolean;
  };

  return {
    ...template,
    html: template.html ?? template.html_content ?? '',
    lexicalJson: template.lexicalJson ?? template.lexical_json ?? null,
    templateKey: template.templateKey ?? template.template_key,
    isDefault: template.isDefault ?? template.is_default ?? false,
  };
};

const normalizeTemplateList = (response: unknown) => {
  const payload = response as { coverPages?: Template[] } | Template[];
  const templates = Array.isArray(payload)
    ? payload
    : (payload?.coverPages ?? []);
  return templates.map(template => normalizeTemplate(template));
};

const normalizeTemplateResponse = (response: any) => {
  const template = response?.coverPage ?? response?.cover_page ?? response;
  return normalizeTemplate(template);
};
const coverPageApi = createApi({
  reducerPath: 'coverPageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: headers => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['CoverPage'],
  endpoints: build => ({
    /*------------------------------------
        Fetch cover page template query
    --------------------------------------*/
    getTemplates: build.query<Template[], void>({
      query: () => '/api/cover-pages',
      transformResponse: normalizeTemplateList,
      providesTags: result =>
        result
          ? [
              { type: 'CoverPage', id: 'LIST' },
              ...result.map(template => ({
                type: 'CoverPage' as const,
                id: template.id,
              })),
            ]
          : [{ type: 'CoverPage', id: 'LIST' }],
    }),
    /*-------------------------------------------
        Fetch sigle cover page template by id
    ---------------------------------------------*/
    getTemplate: build.query<Template, string>({
      query: id => `/api/cover-pages/${id}`,
      transformResponse: normalizeTemplateResponse,
      providesTags: (_result, _error, id) => [{ type: 'CoverPage', id }],
    }),
    /*-------------------------------------------
        Create a new cover page
    ---------------------------------------------*/
    createCoverPage: build.mutation<Template, CoverPagePayload>({
      query: payload => ({
        url: '/api/cover-pages',
        method: 'POST',
        body: toSnakeCoverPagePayload(payload),
      }),
      transformResponse: normalizeTemplateResponse,
      invalidatesTags: [{ type: 'CoverPage', id: 'LIST' }],
    }),
    /*-------------------------------------------
        Update an existing cover page
    ---------------------------------------------*/
    updateCoverPage: build.mutation<
      Template,
      { id: string; data: CoverPagePayload }
    >({
      query: ({ id, data }) => ({
        url: `/api/cover-pages/${id}`,
        method: 'PATCH',
        body: toSnakeCoverPagePayload(data),
      }),
      transformResponse: normalizeTemplateResponse,
      invalidatesTags: (_result, _error, args) => [
        { type: 'CoverPage', id: args.id },
        { type: 'CoverPage', id: 'LIST' },
      ],
    }),
    /*-------------------------------------------
        Delete a cover page
    ---------------------------------------------*/
    deleteCoverPage: build.mutation<void, string>({
      query: id => ({
        url: `/api/cover-pages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'CoverPage', id },
        { type: 'CoverPage', id: 'LIST' },
      ],
    }),
    /*-------------------------------------------
        Update bundle metadata with cover page ids
    ---------------------------------------------*/
    updateBundleMetadata: build.mutation<
      unknown,
      { bundleId: string; metadata: BundleMetadataPayload }
    >({
      query: ({ bundleId, metadata }) => ({
        url: `/api/bundles/${bundleId}/metadata`,
        method: 'PATCH',
        body: metadata,
      }),
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useLazyGetTemplateQuery,
  useCreateCoverPageMutation,
  useUpdateCoverPageMutation,
  useDeleteCoverPageMutation,
  useUpdateBundleMetadataMutation,
} = coverPageApi;

export default coverPageApi;
