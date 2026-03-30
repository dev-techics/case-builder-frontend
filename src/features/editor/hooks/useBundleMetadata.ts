import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { loadComments } from '@/features/toolbar/redux';
import {
  clearDocumentInfo,
  loadMetadataFromBackend,
  setCurrentBundleId,
} from '@/features/properties-panel/redux/propertiesPanelSlice';
import { resolveBundleId } from '@/lib/bundleId';

type UseBundleMetadataOptions = {
  bundleId?: string;
  treeId: string;
};

export const useBundleMetadata = ({
  bundleId,
  treeId,
}: UseBundleMetadataOptions) => {
  const dispatch = useAppDispatch();
  const resolvedBundleId = resolveBundleId({
    routeBundleId: bundleId,
    treeId,
  });

  useEffect(() => {
    if (resolvedBundleId) {
      dispatch(loadComments({ bundleId: resolvedBundleId }));
    }
  }, [dispatch, resolvedBundleId]);

  useEffect(() => {
    if (resolvedBundleId) {
      dispatch(clearDocumentInfo());
    }
  }, [dispatch, resolvedBundleId]);

  useEffect(() => {
    dispatch(setCurrentBundleId(resolvedBundleId));

    if (resolvedBundleId) {
      dispatch(loadMetadataFromBackend(resolvedBundleId));
    }
  }, [dispatch, resolvedBundleId]);
};
