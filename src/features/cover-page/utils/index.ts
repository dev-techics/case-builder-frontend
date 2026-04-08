import type { CoverPageTemplate, CoverPageType } from '../types';

export const isPersistedBundleId = (
  bundleId: string | null | undefined
): bundleId is string => {
  const normalized = bundleId?.trim();

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase() !== 'loading';
};

export const isDraftCoverPageId = (templateId: string | null | undefined) =>
  Boolean(templateId?.startsWith('draft-'));

export const getDraftCoverPageType = (
  templateId: string
): CoverPageType | null => {
  if (templateId.includes('front')) {
    return 'front';
  }

  if (templateId.includes('back')) {
    return 'back';
  }

  return null;
};

export const getDefaultCoverPageName = (type: CoverPageType) =>
  type === 'front' ? 'Front Cover Page' : 'Back Cover Page';

// Utility function to convert camelCase keys in the payload to snake_case before sending it to the API. This ensures that the API receives the data in the expected format, regardless of how it's structured in the frontend.
export const buildCoverPageBundleMetadata = (
  type: CoverPageType,
  templateId: string | null
) =>
  type === 'front'
    ? { front_cover_page_id: templateId }
    : { back_cover_page_id: templateId };

export const createDraftCoverPageTemplate = (
  type: CoverPageType
): CoverPageTemplate => {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  const typeLabel = type === 'front' ? 'Front' : 'Back';

  return {
    id: `draft-${type}-${now}`,
    templateKey: `custom_${type}_${now}`,
    name: `Custom ${typeLabel} Cover Page`,
    description: 'Custom cover page template',
    type,
    isDefault: false,
    html: '',
    builderState: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
