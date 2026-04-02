import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { loadComments } from '@/features/toolbar/redux';
import {
  clearDocumentInfo,
  setCurrentBundleId,
  syncMetadataFromBackend,
} from '@/features/properties-panel/redux/propertiesPanelSlice';
import { useGetMetaDataQuery } from '@/features/properties-panel/api';
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
  const { data: metadata } = useGetMetaDataQuery(
    { bundleId: resolvedBundleId ?? '' },
    {
      skip: !resolvedBundleId,
      refetchOnMountOrArgChange: true,
    }
  );

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
  }, [dispatch, resolvedBundleId]);

  useEffect(() => {
    if (resolvedBundleId && metadata) {
      dispatch(
        syncMetadataFromBackend({
          bundleId: resolvedBundleId,
          metadata,
        })
      );
    }
  }, [dispatch, metadata, resolvedBundleId]);
};
