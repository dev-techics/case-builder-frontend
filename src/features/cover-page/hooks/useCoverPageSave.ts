import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  useCreateCoverPageMutation,
  useUpdateBundleMetadataMutation,
  useUpdateCoverPageMutation,
} from '../api';
import { setCoverPageTemplate } from '../redux/coverPageSlice';
import type { CoverPageTemplate } from '../types';
import {
  buildCoverPageBundleMetadata,
  getDefaultCoverPageName,
  isPersistedBundleId,
} from '../utils';

const buildCoverPageSavePayload = (
  template: CoverPageTemplate,
  isDraft: boolean
) => ({
  templateKey:
    template.templateKey ??
    (isDraft ? `custom_${template.type}_${Date.now()}` : undefined),
  html: template.html,
  builderState: template.builderState,
  type: template.type,
  name: template.name.trim() || getDefaultCoverPageName(template.type),
  description: template.description,
  isDefault: template.isDefault,
});

export const useCoverPageSave = (
  template: CoverPageTemplate | null,
  isDraft: boolean
) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentBundleId = useAppSelector(
    state => state.coverPage.currentBundleId
  );
  const [createCoverPage, { isLoading: isCreating }] =
    useCreateCoverPageMutation();
  const [updateCoverPage, { isLoading: isUpdating }] =
    useUpdateCoverPageMutation();
  const [updateBundleMetadata] = useUpdateBundleMetadataMutation();

  const handleSave = useCallback(async () => {
    if (!template) {
      return;
    }

    try {
      const payload = buildCoverPageSavePayload(template, isDraft);
      const savedTemplate = isDraft
        ? await createCoverPage(payload).unwrap()
        : await updateCoverPage({ id: template.id, data: payload }).unwrap();

      dispatch(setCoverPageTemplate({ template: savedTemplate }));

      if (isPersistedBundleId(currentBundleId)) {
        await updateBundleMetadata({
          bundleId: currentBundleId,
          metadata: buildCoverPageBundleMetadata(
            savedTemplate.type,
            savedTemplate.id.toString()
          ),
        }).unwrap();
      }

      if (isDraft) {
        navigate(`/cover-page-editor/${savedTemplate.id}`, { replace: true });
      }

      navigate(-1);
    } catch (error) {
      console.error('Failed to save cover page:', error);
    }
  }, [
    createCoverPage,
    currentBundleId,
    dispatch,
    isDraft,
    navigate,
    template,
    updateBundleMetadata,
    updateCoverPage,
  ]);

  return {
    handleSave,
    isSaving: isCreating || isUpdating,
  };
};
