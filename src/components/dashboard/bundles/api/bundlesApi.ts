import axiosInstance from '@/api/axiosInstance';
import type { Bundle } from '../types/types';

export interface CreateBundleDto {
  name: string;
  case_number: string;
  status?: 'In Progress' | 'Complete' | 'Review' | 'Archived';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  description?: string;
  tags?: string[];
}

export interface UpdateBundleDto extends Partial<CreateBundleDto> {
  document_count?: number;
}

export interface BundlesResponse {
  bundles: Bundle[];
}

export interface BundleResponse {
  bundle: Bundle;
  message?: string;
}

export const bundlesApi = {
  // Get all bundles
  async getAll(): Promise<BundlesResponse> {
    const { data } = await axiosInstance.get<BundlesResponse>('/api/bundles');
    return data;
  },

  // Get single bundle
  async getOne(id: string): Promise<BundleResponse> {
    const { data } = await axiosInstance.get<BundleResponse>(
      `/api/bundles/${id}`
    );
    return data;
  },

  // Create bundle
  async create(bundleData: CreateBundleDto): Promise<BundleResponse> {
    const { data } = await axiosInstance.post<BundleResponse>(
      '/api/bundles',
      bundleData
    );
    return data;
  },

  // Update bundle
  async update(
    id: string,
    bundleData: UpdateBundleDto
  ): Promise<BundleResponse> {
    const { data } = await axiosInstance.put<BundleResponse>(
      `/api/bundles/${id}`,
      bundleData
    );
    return data;
  },

  // Duplicate bundle
  async duplicate(id: string): Promise<BundleResponse> {
    const { data } = await axiosInstance.post<BundleResponse>(
      `/api/bundles/${id}/duplicate`
    );
    return data;
  },

  // Delete bundle
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await axiosInstance.delete<{ message: string }>(
      `/api/bundles/${id}`
    );
    return data;
  },
};
