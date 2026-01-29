import axiosInstance from '@/api/axiosInstance';

export class CoverPageApi {
  /**
   * Update bundle metadata
   */
  static async updateMetadata(
    bundleId: string,
    metadata: {
      front_cover_page_id?: string;
      back_cover_page_id?: string;
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
  static async getCoverPages() {
    const response = await axiosInstance.get('/api/cover-pages');
    return response.data;
  }
}
