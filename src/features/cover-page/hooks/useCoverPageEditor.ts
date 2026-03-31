import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setCoverPageName,
  setCoverPageTemplate,
} from '../redux/coverPageSlice';
import {
  resolveEditorCoverPage,
  selectCoverPageState,
} from '../redux/selectors';
import { useGetTemplateQuery } from '../api';
import { useCoverPageSave } from './useCoverPageSave';
import { isDraftCoverPageId } from '../utils';

type EditorLoadState =
  | 'missing-id'
  | 'draft-missing'
  | 'loading'
  | 'error'
  | 'ready';

export const useCoverPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const coverPageState = useAppSelector(selectCoverPageState);

  const templateId = id ?? '';
  const isDraft = isDraftCoverPageId(templateId);
  const cachedTemplate = resolveEditorCoverPage(coverPageState, templateId);
  const shouldFetchTemplate =
    Boolean(templateId) && !isDraft && !cachedTemplate;

  const {
    data: fetchedTemplate,
    isLoading,
    isError,
  } = useGetTemplateQuery(templateId, {
    skip: !shouldFetchTemplate,
  });

  useEffect(() => {
    if (fetchedTemplate) {
      dispatch(setCoverPageTemplate({ template: fetchedTemplate }));
    }
  }, [dispatch, fetchedTemplate]);

  const template = cachedTemplate ?? fetchedTemplate ?? null;
  const { handleSave, isSaving } = useCoverPageSave(template, isDraft);

  const loadState = useMemo<EditorLoadState>(() => {
    if (!templateId) {
      return 'missing-id';
    }

    if (template) {
      return 'ready';
    }

    if (isDraft) {
      return 'draft-missing';
    }

    if (isLoading) {
      return 'loading';
    }

    if (isError || (shouldFetchTemplate && !fetchedTemplate)) {
      return 'error';
    }

    return 'error';
  }, [
    fetchedTemplate,
    isDraft,
    isError,
    isLoading,
    shouldFetchTemplate,
    template,
    templateId,
  ]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleNameChange = useCallback(
    (value: string) => {
      if (!template) {
        return;
      }

      dispatch(setCoverPageName({ type: template.type, name: value }));
    },
    [dispatch, template]
  );

  return {
    template,
    isSaving,
    loadState,
    handleCancel,
    handleNameChange,
    handleSave,
  };
};
