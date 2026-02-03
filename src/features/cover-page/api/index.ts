import axiosInstance from '@/api/axiosInstance';

export class CoverPageApi {
  /**
   * *Create a new cover page (coming soon feature)
   */
  static async createCoverPage(data: {
    template_key: string;
    values?: Record<string, any>;
    html_content?: string;
    lexical_json?: string;
    type: string;
    name?: string;
    description?: string;
    is_default?: boolean;
  }) {
    const response = await axiosInstance.post('/api/cover-pages', data);
    return response.data.cover_page;
  }

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

  /**
   * Update an existing cover page
   */
  static async updateCoverPage(
    coverPageId: string,
    data: {
      template_key?: any;
      values?: Record<string, any>;
      html_content?: string;
      lexical_json?: string;
      type?: string;
      name?: string;
      description?: string;
      is_default?: boolean;
    }
  ) {
    const response = await axiosInstance.patch(
      `/api/cover-pages/${coverPageId}`,
      data
    );
    return response.data.cover_page;
  }
}
