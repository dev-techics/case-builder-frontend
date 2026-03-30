import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import LexicalCoverPageEditor from './LexicalCoverPageEditor';
import { setCoverPageName, setTemplate } from '../../redux/coverPageSlice';
import { useGetTemplateQuery } from '../../api';
import { useCoverPageSave } from '../../hook';
import CoverPageEditorHeader from './CoverPageEditorHeader';

export const CoverPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { frontCoverPage, backCoverPage } = useAppSelector(
    state => state.coverPage
  );

  const templateId = id ?? '';
  const isDraft = templateId.startsWith('draft-');

  /*------------------------------------------------------------
   Select template from Redux store if it matches the URL param,
   otherwise rely on RTK Query to fetch it.
   -------------------------------------------------------------*/
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

  // If template is not in the Redux store (e.g., user navigated directly to the URL), fetch it from the server
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

  //* Custom hook to handle saving logic, including API calls and state management
  const { handleSave, isSaving } = useCoverPageSave(template, isDraft);
  const [showPreview, setShowPreview] = useState(false);

  const handleCancel = () => {
    navigate(-1);
  };

  /*--------------------------------- 
    Handle Error and Loading states 
  -----------------------------------*/
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
