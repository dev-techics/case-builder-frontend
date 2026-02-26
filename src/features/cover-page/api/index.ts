import axiosInstance from '@/api/axiosInstance';
import type { Template } from '../types';

export class CoverPageApi {
  /**
   * *Create a new cover page (coming soon feature)
   */
  static async createCoverPage(data: {
    templateKey: string;
    values?: Record<string, any>;
    html?: string;
    lexicalJson?: string;
    type: string;
    name?: string;
    description?: string;
    isDefault?: boolean;
  }) {
    const response = await axiosInstance.post('/api/cover-pages', data);
    const payload = response.data;
    return payload.coverPage ?? payload;
  }

  /**
   * Update bundle metadata
   */
  static async updateMetadata(
    bundleId: string,
    metadata: {
      front_cover_page_id?: string | null;
      back_cover_page_id?: string | null;
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
  static async getCoverPages(): Promise<Template[]> {
    const response = await axiosInstance.get<Template[]>('/api/cover-pages');
    console.log(response.data);
    const payload: any = response.data;
    return payload.coverPages ?? payload;
  }

  /**
   * Update an existing cover page
   */
  static async updateCoverPage(
    coverPageId: string,
    data: {
      templateKey?: any;
      html?: string;
      lexicalJson?: string;
      type?: string;
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ): Promise<Template> {
    const response = await axiosInstance.patch(
      `/api/cover-pages/${coverPageId}`,
      data
    );
    const payload = response.data;
    return payload.coverPage ?? payload;
  }

  /**
   * Delete a cover page
   */
  static async deleteCoverPage(coverPageId: string): Promise<void> {
    await axiosInstance.delete(`/api/cover-pages/${coverPageId}`);
  }
}
