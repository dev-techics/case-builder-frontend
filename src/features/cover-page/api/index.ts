import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Template } from '../types';

const BaseQuery = import.meta.env.VITE_BASE_URL;

const coverPageApi = createApi({
  reducerPath: 'coverPageApi',
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
  // add bearer token here
  endpoints: build => ({
    /*------------------------------------
        Fetch cover page template query
    --------------------------------------*/
    getTemplates: build.query<Template[], void>({
      query: () => '/api/cover-pages',
      transformResponse: (response: unknown) => {
        const payload = response as { coverPages?: Template[] } | Template[];
        if (Array.isArray(payload)) {
          return payload;
        }
        return payload?.coverPages ?? [];
      },
    }),
    /*-------------------------------------------
        Fetch sigle cover page template by id
    ---------------------------------------------*/
    getTemplate: build.query<Template, string>({
      query: id => `/api/cover-pages/${id}`,
      transformResponse: (response: unknown) => {
        const payload = response as { coverPage?: Template } | Template;
        return (payload as { coverPage?: Template })?.coverPage ?? payload;
      },
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useLazyGetTemplateQuery,
} = coverPageApi;

export default coverPageApi;
