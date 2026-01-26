export interface CoverPageField {
  name: string;
  x: number;
  y: number;
  font: string;
  size: number;
  align: 'left' | 'center' | 'right';
  bold?: boolean;
  color?: string;
  maxWidth?: number;
}

export interface CoverPageTemplate {
  key: string;
  name: string;
  description: string;
  page: {
    size: 'A4' | 'Letter';
    margin: number;
    orientation: 'portrait' | 'landscape';
  };
  fields: CoverPageField[];
  preview?: string;
}

export interface CoverPageData {
  template_key: string;
  enabled: boolean;
  values: Record<string, string>;
}
