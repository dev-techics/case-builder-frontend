import axiosInstance from '@/api/axiosInstance';

export const editorApi = {
  async deleteDocument(documentId: string) {
    const response = await axiosInstance.delete(`/api/documents/${documentId}`);
    return response.data;
  },
};
