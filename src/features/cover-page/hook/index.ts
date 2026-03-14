/**
 * Cover page handlers hooks
 *
 *
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTemplate, deSelectCoverPage } from '../redux/coverPageSlice';
import {
  useLazyGetTemplateQuery,
  useUpdateBundleMetadataMutation,
} from '../api';
import type { Template } from '../types';

type CoverPageSide = 'front' | 'back';

const buildDraftTemplate = (
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

export const useCoverPageHandlers = (type: CoverPageSide) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [fetchTemplateById] = useLazyGetTemplateQuery();
  const [updateBundleMetadata] = useUpdateBundleMetadataMutation();
  const { currentBundleId } = useAppSelector(state => state.coverPage);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  /*--------------------------------------------------
    Select template and save the id in bundle metadata 
    and also save in the local state
   ---------------------------------------------------*/
  const handleSelectTemplate = useCallback(
    async (id: string) => {
      try {
        const template = await fetchTemplateById(id).unwrap();
        dispatch(setTemplate({ template }));
        setTemplateDialogOpen(false);

        if (currentBundleId) {
          await updateBundleMetadata({
            bundleId: currentBundleId,
            metadata:
              template.type === 'front'
                ? { front_cover_page_id: template.id }
                : { back_cover_page_id: template.id },
          }).unwrap();
        }
      } catch (error) {
        console.error('Failed to load cover page template:', error);
      }
    },
    [currentBundleId, dispatch, fetchTemplateById, updateBundleMetadata]
  );

  /*---------------------------------
    Handle create template function
  -----------------------------------*/
  const handleCreateTemplate = useCallback(() => {
    const coverType = type.toLowerCase() as 'front' | 'back';
    const draftTemplate = buildDraftTemplate(coverType, type);

    // Draft template stays local until the user explicitly saves it.
    dispatch(setTemplate({ template: draftTemplate }));

    setTemplateDialogOpen(false);
    navigate(`/cover-page-editor/${draftTemplate.id}`);
  }, [dispatch, navigate, type]);

  /*--------------------------- 
        Handle remove template
   ---------------------------*/
  const handleRemoveTemplate = useCallback(async () => {
    dispatch(deSelectCoverPage(type));

    if (!currentBundleId) {
      return;
    }

    try {
      await updateBundleMetadata({
        bundleId: currentBundleId,
        metadata:
          type === 'front'
            ? { front_cover_page_id: null }
            : { back_cover_page_id: null },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update cover page metadata:', error);
    }
  }, [currentBundleId, dispatch, type, updateBundleMetadata]);

  return {
    isTemplateDialogOpen,
    setTemplateDialogOpen,
    handleSelectTemplate,
    handleCreateTemplate,
    handleRemoveTemplate,
  };
};

export * from './useToolbarHandlers';
