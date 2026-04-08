// src/api/axiosInstance.ts
import axios from 'axios';
import camelcaseKeys from 'camelcase-keys';

const API_URL = import.meta.env.VITE_BASE_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 0, // Increased timeout for PDF processing - 86400000
});

/*------------------------------------
 Request interceptor to add auth token
 --------------------------------------*/
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/*-------------------------------------------------------
  Response interceptor to convert snake_case to camelCase
---------------------------------------------------------*/
axiosInstance.interceptors.response.use(response => {
  if (response.data) {
    const responseType = response.config?.responseType;
    const isBinaryResponse =
      responseType === 'blob' || responseType === 'arraybuffer';
    const isBinaryData =
      response.data instanceof Blob || response.data instanceof ArrayBuffer;
    const isTransformable =
      typeof response.data === 'object' && !isBinaryResponse && !isBinaryData;

    if (isTransformable) {
      response.data = camelcaseKeys(response.data, { deep: true });
    }
  }
  return response;
});

export class DocumentApiService {
  /**
   * Get the authenticated PDF URL with headers/footers applied
   * Returns a blob URL that can be used in PDF viewers
   */
  static getDocumentStreamUrl(documentId: string): string {
    return `${API_URL}/api/documents/${documentId}/stream`;
  }
}

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // If unauthorized (401), clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Optionally redirect to login
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
