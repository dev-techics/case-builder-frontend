import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  useCreateCoverPageMutation,
  useUpdateBundleMetadataMutation,
  useUpdateCoverPageMutation,
} from '../api';
import { setTemplate } from '../redux/coverPageSlice';
import type { Template } from '../types';
import { isPersistedBundleId } from '../utils';

const resolveCoverPageName = (type: 'front' | 'back', name?: string) => {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed;
  }
  return type === 'front' ? 'Front Cover Page' : 'Back Cover Page';
};

export const useCoverPageSave = (
  template: Template | null,
  isDraft: boolean
) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentBundleId } = useAppSelector(state => state.coverPage);
  const [createCoverPage, { isLoading: isCreating }] =
    useCreateCoverPageMutation();
  const [updateCoverPage, { isLoading: isUpdating }] =
    useUpdateCoverPageMutation();
  const [updateBundleMetadata] = useUpdateBundleMetadataMutation();

  const handleSave = useCallback(async () => {
    if (!template) {
      return;
    }

    const templateKey =
      template.templateKey ??
      (isDraft ? `custom_${template.type}_${Date.now()}` : undefined);

    const payload = {
      templateKey,
      html: template.html,
      lexicalJson: template.lexicalJson,
      type: template.type,
      name: resolveCoverPageName(template.type, template.name),
      description: template.description,
      isDefault: template.isDefault,
    };

    try {
      // If it's a draft, we create a new template. Otherwise, we update the existing one.
      const savedTemplate = isDraft
        ? await createCoverPage(payload).unwrap()
        : await updateCoverPage({ id: template.id, data: payload }).unwrap();

      dispatch(setTemplate({ template: savedTemplate }));

      if (isPersistedBundleId(currentBundleId)) {
        await updateBundleMetadata({
          bundleId: currentBundleId,
          metadata:
            savedTemplate.type === 'front'
              ? { front_cover_page_id: savedTemplate.id }
              : { back_cover_page_id: savedTemplate.id },
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
