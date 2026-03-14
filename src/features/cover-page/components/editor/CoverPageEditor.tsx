import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import LexicalCoverPageEditor from './LexicalCoverPageEditor';
import { setCoverPageName, setTemplate } from '../../redux/coverPageSlice';
import {
  useCreateCoverPageMutation,
  useGetTemplateQuery,
  useUpdateBundleMetadataMutation,
  useUpdateCoverPageMutation,
} from '../../api';
import CoverPageEditorHeader from './CoverPageEditorHeader';

const resolveCoverPageName = (type: 'front' | 'back', name?: string) => {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed;
  }
  return type === 'front' ? 'Front Cover Page' : 'Back Cover Page';
};

export const CoverPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { frontCoverPage, backCoverPage, currentBundleId } = useAppSelector(
    state => state.coverPage
  );

  const templateId = id ?? '';
  const isDraft = templateId.startsWith('draft-');
  const template =
    frontCoverPage?.id === templateId
      ? frontCoverPage
      : backCoverPage?.id === templateId
        ? backCoverPage
        : isDraft
          ? templateId.includes('front')
            ? frontCoverPage
            : backCoverPage
          : null;

  const shouldSkipQuery = !templateId || isDraft || Boolean(template);
  const {
    data: fetchedTemplate,
    isLoading,
    isError,
  } = useGetTemplateQuery(templateId, {
    skip: shouldSkipQuery,
  });

  useEffect(() => {
    if (fetchedTemplate) {
      dispatch(setTemplate({ template: fetchedTemplate }));
    }
  }, [dispatch, fetchedTemplate]);

  const [createCoverPage, { isLoading: isCreating }] =
    useCreateCoverPageMutation();
  const [updateCoverPage, { isLoading: isUpdating }] =
    useUpdateCoverPageMutation();
  const [updateBundleMetadata] = useUpdateBundleMetadataMutation();
  const isSaving = isCreating || isUpdating;
  const [showPreview, setShowPreview] = useState(false);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async () => {
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
      // Draft templates are created on the server the first time the user saves.
      const savedTemplate = isDraft
        ? await createCoverPage(payload).unwrap()
        : await updateCoverPage({ id: template.id, data: payload }).unwrap();

      console.log(savedTemplate);
      dispatch(setTemplate({ template: savedTemplate }));

      if (currentBundleId) {
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
    } catch (error) {
      console.error('Failed to save cover page:', error);
    }
  };

  if (!templateId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Missing cover page id.
      </div>
    );
  }

  if (!template) {
    if (isDraft) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Draft cover page not found.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Loading cover page...
        </div>
      );
    }

    if (isError || (!isDraft && !fetchedTemplate)) {
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          Unable to load cover page.
        </div>
      );
    }

    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Preparing editor...
      </div>
    );
  }

  const handleNameChange = (value: string) => {
    dispatch(setCoverPageName({ type: template.type, name: value }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-100">
      {/* -------------------
            Editor Header 
        -------------------*/}
      <CoverPageEditorHeader
        handleNameChange={handleNameChange}
        handleCancel={handleCancel}
        handleSave={handleSave}
        isSaving={isSaving}
        template={template}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
      />
      {/*-------------------
                Editor 
        --------------------*/}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-4">
        <LexicalCoverPageEditor
          type={template.type}
          showPreview={showPreview}
        />
      </div>
    </div>
  );
};
