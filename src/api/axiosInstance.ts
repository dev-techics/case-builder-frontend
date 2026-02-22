// src/api/axiosInstance.ts
import type { Tree } from '@/features/file-explorer/redux/fileTreeSlice';
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
  timeout: 30000, // Increased timeout for PDF processing
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
   * Fetch the file tree for a bundle
   */
  static async fetchTree(bundleId: string): Promise<Tree> {
    const response = await axiosInstance.get(
      `/api/bundles/${bundleId}/documents`
    );
    return response.data;
  }

  /**
   * Upload one or multiple PDF files
   */
  static async uploadFiles(
    bundleId: string,
    files: File[],
    parentId?: string
  ): Promise<any> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files[]', file);
    });

    if (parentId) {
      formData.append('parent_id', parentId);
    }

    const response = await axiosInstance.post(
      `/bundles/${bundleId}/documents/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Create a new folder
   */
  static async createFolder(
    bundleId: string,
    name: string,
    parentId?: string
  ): Promise<any> {
    const response = await axiosInstance.post(
      `/bundles/${bundleId}/documents`,
      {
        name,
        type: 'folder',
        parent_id: parentId,
      }
    );
    return response.data;
  }

  /**
   * Rename a file or folder
   */
  static async renameDocument(
    documentId: string,
    newName: string
  ): Promise<any> {
    const response = await axiosInstance.patch(
      `/documents/${documentId}/rename`,
      {
        name: newName,
      }
    );
    return response.data;
  }

  /**
   * Delete a file or folder
   */
  static async deleteDocument(documentId: string): Promise<any> {
    const response = await axiosInstance.delete(`/api/documents/${documentId}`);
    return response.data;
  }

  /**
   * Reorder documents (after drag & drop)
   */
  static async reorderDocuments(
    bundleId: string,
    items: Array<{ id: string; order: number }>
  ): Promise<any> {
    const response = await axiosInstance.post(
      `/bundles/${bundleId}/documents/reorder`,
      {
        items,
      }
    );
    return response.data;
  }

  /**
   * Get the authenticated PDF URL with headers/footers applied
   * Returns a blob URL that can be used in PDF viewers
   */
  static getDocumentStreamUrl(documentId: string): string {
    return `${API_URL}/api/documents/${documentId}/stream`;
  }

  /**
   * Get index stream URL
   */
  static getIndexStreamUrl(bundleId: string): string {
    return `${API_URL}/api/bundles/${bundleId}/index-stream`;
  }
  /**
   *
   * @param documentId
   * @param newParentId
   * @returns
   */
  static async moveDocument(
    documentId: string,
    newParentId: string | null
  ): Promise<any> {
    const response = await axiosInstance.patch(
      `/api/documents/${documentId}/move`,
      {
        parent_id: newParentId,
      }
    );
    return response.data;
  }
}

export class BundleApiService {
  /**
   * Update bundle metadata (headers/footers)
   */
  static async updateMetadata(
    bundleId: string,
    metadata: {
      header_left?: string;
      header_right?: string;
      footer?: string;
    }
  ): Promise<any> {
    const response = await axiosInstance.patch(
      `/api/bundles/${bundleId}/metadata`,
      metadata
    );
    return response.data;
  }

  /**
   * Get bundle details
   */
  static async getBundle(bundleId: string): Promise<any> {
    const response = await axiosInstance.get(`/api/bundles/${bundleId}`);
    return response.data;
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
