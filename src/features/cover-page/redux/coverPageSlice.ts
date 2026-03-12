import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Template } from '../types';

type CoverPageType = 'front' | 'back';
type CoverPageSide = 'Front' | 'Back' | 'front' | 'back';

interface CoverPageState {
  frontCoverPage: Template | null;
  backCoverPage: Template | null;
  currentBundleId: string | null;
}

const initialState: CoverPageState = {
  frontCoverPage: null,
  backCoverPage: null,
  currentBundleId: null,
};

const normalizeSide = (side: CoverPageSide): CoverPageType =>
  side.toLowerCase() as CoverPageType;

const coverPageSlice = createSlice({
  name: 'coverPage',
  initialState,
  reducers: {
    /*---------------------------------------
      Set selected cover page to redux state
    -----------------------------------------*/
    setTemplate: (state, action: PayloadAction<{ template: Template }>) => {
      const { template } = action.payload;

      if (template.type === 'front') {
        state.frontCoverPage = template;
      } else {
        state.backCoverPage = template;
      }
    },
    /*---------------------------------------
      Deselect Cover page from export option
    -----------------------------------------*/
    deSelectCoverPage: (state, action: PayloadAction<CoverPageSide>) => {
      const type = normalizeSide(action.payload);

      if (type === 'front') {
        state.frontCoverPage = null;
      } else {
        state.backCoverPage = null;
      }
    },
    /*--------------------------------------------
      Keep editor changes in the selected template
    ---------------------------------------------*/
    setCoverPageHtml: (
      state,
      action: PayloadAction<{
        type: CoverPageType;
        html: string;
      }>
    ) => {
      const { type, html } = action.payload;
      const target = type === 'front' ? state.frontCoverPage : state.backCoverPage;

      if (target) {
        target.html = html;
      }
    },

    setCoverPageLexicalJson: (
      state,
      action: PayloadAction<{
        type: CoverPageType;
        lexicalJson: string | null;
      }>
    ) => {
      const { type, lexicalJson } = action.payload;
      const target = type === 'front' ? state.frontCoverPage : state.backCoverPage;

      if (target) {
        target.lexicalJson = lexicalJson;
      }
    },

    setCoverPageName: (
      state,
      action: PayloadAction<{ type: CoverPageType; name: string }>
    ) => {
      const { type, name } = action.payload;
      const target = type === 'front' ? state.frontCoverPage : state.backCoverPage;

      if (target) {
        target.name = name;
      }
    },

    setBundleId: (state, action: PayloadAction<string>) => {
      state.currentBundleId = action.payload;
    },
  },
});

export const {
  setTemplate,
  setCoverPageHtml,
  setCoverPageLexicalJson,
  setCoverPageName,
  setBundleId,
  deSelectCoverPage,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
