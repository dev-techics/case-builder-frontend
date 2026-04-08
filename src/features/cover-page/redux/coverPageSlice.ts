import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CoverPageState,
  CoverPageTemplate,
  CoverPageType,
} from '../types';
import { isPersistedBundleId } from '../utils';

const initialState: CoverPageState = {
  frontCoverPage: null,
  backCoverPage: null,
  currentBundleId: null,
};

const getCoverPageTarget = (state: CoverPageState, type: CoverPageType) =>
  type === 'front' ? state.frontCoverPage : state.backCoverPage;

const setCoverPageTarget = (
  state: CoverPageState,
  template: CoverPageTemplate
) => {
  if (template.type === 'front') {
    state.frontCoverPage = template;
    return;
  }

  state.backCoverPage = template;
};

const coverPageSlice = createSlice({
  name: 'coverPage',
  initialState,
  reducers: {
    setCoverPageTemplate: (
      state,
      action: PayloadAction<{ template: CoverPageTemplate }>
    ) => {
      setCoverPageTarget(state, action.payload.template);
    },
    clearCoverPageTemplate: (state, action: PayloadAction<CoverPageType>) => {
      const type = action.payload;
      if (type === 'front') {
        state.frontCoverPage = null;
      } else {
        state.backCoverPage = null;
      }
    },
    setCoverPageHtml: (
      state,
      action: PayloadAction<{
        type: CoverPageType;
        html: string;
      }>
    ) => {
      const { type, html } = action.payload;
      const target = getCoverPageTarget(state, type);

      if (target) {
        target.html = html;
      }
    },

    setCoverPageBuilderState: (
      state,
      action: PayloadAction<{
        type: CoverPageType;
        builderState: string | null;
      }>
    ) => {
      const { type, builderState } = action.payload;
      const target = getCoverPageTarget(state, type);

      if (target) {
        target.builderState = builderState;
      }
    },

    setCoverPageName: (
      state,
      action: PayloadAction<{ type: CoverPageType; name: string }>
    ) => {
      const { type, name } = action.payload;
      const target = getCoverPageTarget(state, type);

      if (target) {
        target.name = name;
      }
    },

    setBundleId: (state, action: PayloadAction<string | null>) => {
      state.currentBundleId = isPersistedBundleId(action.payload)
        ? action.payload
        : null;
    },
  },
});

export const {
  setCoverPageTemplate,
  setCoverPageHtml,
  setCoverPageBuilderState,
  setCoverPageName,
  setBundleId,
  clearCoverPageTemplate,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
