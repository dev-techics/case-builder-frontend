import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  useLazyGetTemplateQuery,
  useUpdateBundleMetadataMutation,
} from '../api';
import {
  clearCoverPageTemplate,
  setCoverPageTemplate,
} from '../redux/coverPageSlice';
import type { CoverPageType } from '../types';
import {
  buildCoverPageBundleMetadata,
  createDraftCoverPageTemplate,
  isPersistedBundleId,
} from '../utils';

export const useCoverPageActions = (type: CoverPageType) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [fetchTemplateById] = useLazyGetTemplateQuery();
  const [updateBundleMetadata] = useUpdateBundleMetadataMutation();
  const currentBundleId = useAppSelector(
    state => state.coverPage.currentBundleId
  );
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  const syncBundleMetadata = useCallback(
    async (templateId: string | null) => {
      if (!isPersistedBundleId(currentBundleId)) {
        return;
      }

      await updateBundleMetadata({
        bundleId: currentBundleId,
        metadata: buildCoverPageBundleMetadata(type, templateId),
      }).unwrap();
    },
    [currentBundleId, type, updateBundleMetadata]
  );

  const handleSelectTemplate = useCallback(
    async (id: string) => {
      try {
        const template = await fetchTemplateById(id).unwrap();
        dispatch(setCoverPageTemplate({ template }));
        setTemplateDialogOpen(false);
        await syncBundleMetadata(template.id);
      } catch (error) {
        console.error('Failed to load cover page template:', error);
      }
    },
    [dispatch, fetchTemplateById, syncBundleMetadata]
  );

  const handleCreateTemplate = useCallback(() => {
    const draftTemplate = createDraftCoverPageTemplate(type);

    dispatch(setCoverPageTemplate({ template: draftTemplate }));
    setTemplateDialogOpen(false);
    navigate(`/cover-page-editor/${draftTemplate.id}`);
  }, [dispatch, navigate, type]);

  const handleRemoveTemplate = useCallback(async () => {
    dispatch(clearCoverPageTemplate(type));

    try {
      await syncBundleMetadata(null);
    } catch (error) {
      console.error('Failed to update cover page metadata:', error);
    }
  }, [dispatch, syncBundleMetadata, type]);

  return {
    isTemplateDialogOpen,
    setTemplateDialogOpen,
    handleSelectTemplate,
    handleCreateTemplate,
    handleRemoveTemplate,
  };
};
