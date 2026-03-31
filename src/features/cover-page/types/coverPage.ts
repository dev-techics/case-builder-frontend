export type CoverPageType = 'front' | 'back';

export interface CoverPageTemplate {
  id: string;
  templateKey?: string;
  name: string;
  description: string;
  type: CoverPageType;
  isDefault: boolean;
  html: string;
  builderState: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Template = CoverPageTemplate;

export interface CoverPageState {
  frontCoverPage: CoverPageTemplate | null;
  backCoverPage: CoverPageTemplate | null;
  currentBundleId: string | null;
}
