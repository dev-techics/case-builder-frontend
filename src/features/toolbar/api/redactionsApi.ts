import axiosInstance from '@/api/axiosInstance';
import type {
  CreateRedactionRequest,
  RedactionApiResponse,
} from '@/features/toolbar/types/types';

export const redactionsApi = {
  async fetchRedactions(bundleId: string): Promise<RedactionApiResponse[]> {
    const response = await axiosInstance.get(
      `/api/bundles/${bundleId}/redactions`
    );
    return response.data.redactions;
  },

  async createRedaction(
    bundleId: string,
    data: CreateRedactionRequest
  ): Promise<RedactionApiResponse> {
    const response = await axiosInstance.post(
      `/api/bundles/${bundleId}/redactions`,
      data
    );
    return response.data.redaction;
  },

  async deleteRedaction(redactionId: string): Promise<void> {
    await axiosInstance.delete(`/api/redactions/${redactionId}`);
  },
};
