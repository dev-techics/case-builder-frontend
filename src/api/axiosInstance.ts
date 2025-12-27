import type { Tree } from '@/features/file-explorer/fileTreeSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BASE_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
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

export class DocumentApiService {
  /**
   * Fetch the file tree for a bundle
   */
  static async fetchTree(bundleId: string): Promise<Tree> {
    const response = await axiosInstance.get(`/bundles/${bundleId}/documents`);
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
    const response = await axiosInstance.delete(`/documents/${documentId}`);
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
   * Get the stream URL for a document WITH authentication
   * This creates a blob URL that can be used in PDF viewers
   */
  static async getAuthenticatedPdfUrl(documentId: string): Promise<string> {
    const token = localStorage.getItem('auth_token');

    const response = await axiosInstance.get(
      `/documents/${documentId}/stream`,
      {
        responseType: 'blob', // Important: tell axios to expect binary data
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Create a blob URL from the response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    return url;
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
