export const BUNDLE_LOADING_TREE_ID = 'bundle-loading';
const BUNDLE_TREE_PREFIX = 'bundle-';

export const normalizeBundleId = (
  bundleId: string | null | undefined
): string | null => {
  const normalized = bundleId?.trim();

  if (!normalized || normalized.toLowerCase() === 'loading') {
    return null;
  }

  return normalized;
};

export const resolveBundleIdFromTreeId = (
  treeId: string | null | undefined
): string | null => {
  const normalizedTreeId = treeId?.trim();

  if (!normalizedTreeId || normalizedTreeId === BUNDLE_LOADING_TREE_ID) {
    return null;
  }

  if (normalizedTreeId.startsWith(BUNDLE_TREE_PREFIX)) {
    return normalizeBundleId(normalizedTreeId.slice(BUNDLE_TREE_PREFIX.length));
  }

  return normalizeBundleId(normalizedTreeId);
};

export const resolveBundleId = ({
  routeBundleId,
  treeId,
}: {
  routeBundleId?: string | null;
  treeId?: string | null;
}): string | null =>
  normalizeBundleId(routeBundleId) ?? resolveBundleIdFromTreeId(treeId);
