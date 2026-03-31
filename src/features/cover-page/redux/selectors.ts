import type { RootState } from '@/app/store';
import type {
  CoverPageState,
  CoverPageTemplate,
  CoverPageType,
} from '../types';
import { getDraftCoverPageType, isDraftCoverPageId } from '../utils';

type CoverPageSelectionState = Pick<
  CoverPageState,
  'frontCoverPage' | 'backCoverPage'
>;

export const selectCoverPageState = (state: RootState) => state.coverPage;

export const getCoverPageByType = (
  coverPageState: CoverPageSelectionState,
  type: CoverPageType
): CoverPageTemplate | null =>
  type === 'front'
    ? coverPageState.frontCoverPage
    : coverPageState.backCoverPage;

export const selectCoverPageByType = (state: RootState, type: CoverPageType) =>
  getCoverPageByType(state.coverPage, type);

export const findCoverPageById = (
  coverPageState: CoverPageSelectionState,
  templateId: string
) => {
  if (coverPageState.frontCoverPage?.id === templateId) {
    return coverPageState.frontCoverPage;
  }

  if (coverPageState.backCoverPage?.id === templateId) {
    return coverPageState.backCoverPage;
  }

  return null;
};

export const resolveEditorCoverPage = (
  coverPageState: CoverPageSelectionState,
  templateId: string
) => {
  const matchedTemplate = findCoverPageById(coverPageState, templateId);
  if (matchedTemplate) {
    return matchedTemplate;
  }

  if (!isDraftCoverPageId(templateId)) {
    return null;
  }

  const draftType = getDraftCoverPageType(templateId);
  return draftType ? getCoverPageByType(coverPageState, draftType) : null;
};
