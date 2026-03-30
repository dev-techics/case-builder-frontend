import type { Template } from '../types';

export const isPersistedBundleId = (
  bundleId: string | null | undefined
): bundleId is string => {
  const normalized = bundleId?.trim();

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase() !== 'loading';
};

/**
 * Builds a draft template with unique ID and timestamp
 * @param type front | back
 * @param label front | back
 * @returns Template object with unique id and default values for a new cover page template
 */
export const buildDraftTemplate = (
  type: 'front' | 'back',
  label: 'front' | 'back'
): Template => {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();

  return {
    id: `draft-${type}-${now}`,
    templateKey: `custom_${type}_${now}`,
    name: `Custom ${label} Cover Page`,
    description: 'Custom template',
    type,
    isDefault: false,
    html: '',
    lexicalJson: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
