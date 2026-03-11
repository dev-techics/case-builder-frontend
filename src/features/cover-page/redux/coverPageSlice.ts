// redux/coverPageSlice.ts - Updated for HTML content
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { Template } from '../types';

interface SelectedCoverPage {
  id: string;
  name: string;
  html: string;
  lexicalJson: string;
}

interface CoverPageState {
  frontCoverPage: SelectedCoverPage | null;
  backCoverPage: SelectedCoverPage | null;
  isEditing: boolean;
  isSaving: boolean;
  currentBundleId: string | null;
}

const initialState: CoverPageState = {
  frontCoverPage: null,
  backCoverPage: null,
  isEditing: false,
  isSaving: false,
  currentBundleId: null,
};

// Save/update cover page data with HTML
export const saveCoverPageData = createAsyncThunk(
  'coverPage/saveData',
  async (type: 'front' | 'back', { getState }) => {
    const state = getState() as any;
    const {
      frontHtml,
      backHtml,
      frontLexicalJson,
      backLexicalJson,
      frontTemplateKey,
      backTemplateKey,
      frontCoverPageId,
      backCoverPageId,
      frontName,
      backName,
      templates,
    } = state.coverPage;

    const html = type === 'front' ? frontHtml : backHtml;
    const lexicalJson = type === 'front' ? frontLexicalJson : backLexicalJson;
    const templateKey = type === 'front' ? frontTemplateKey : backTemplateKey;
    const currentCoverPageId =
      type === 'front' ? frontCoverPageId : backCoverPageId;
    const selectedTemplate = templates.find(
      (template: any) => template.templateKey === templateKey
    );
    const fallbackName =
      type === 'front' ? 'Front Cover Page' : 'Back Cover Page';
    const resolvedName =
      (type === 'front' ? frontName : backName).trim() ||
      selectedTemplate?.name ||
      fallbackName;

    const payload = {
      templateKey: templateKey,
      html: html,
      lexicalJson: lexicalJson || undefined,
      type: type,
      name: resolvedName,
      description: selectedTemplate?.description,
    };

    let response;
    if (currentCoverPageId) {
      // Update existing cover page
      response = await CoverPageApi.updateCoverPage(
        currentCoverPageId,
        payload
      );
    } else {
      // Create new cover page
      response = await CoverPageApi.createCoverPage(payload);
    }

    return { type, response };
  }
);

// Delete a cover page template
export const deleteCoverPage = createAsyncThunk(
  'coverPage/deleteCoverPage',
  async ({ id }: { id: string }, { getState }) => {
    const state = getState() as any;
    const { currentBundleId, frontCoverPageId, backCoverPageId } =
      state.coverPage;

    await CoverPageApi.deleteCoverPage(id);

    if (
      currentBundleId &&
      (id === frontCoverPageId || id === backCoverPageId)
    ) {
      await CoverPageApi.updateMetadata(currentBundleId, {
        ...(id === frontCoverPageId ? { front_cover_page_id: null } : {}),
        ...(id === backCoverPageId ? { back_cover_page_id: null } : {}),
      });
    }

    return { id };
  }
);

const coverPageSlice = createSlice({
  name: 'coverPage',
  initialState,
  reducers: {
    setEnabled: (
      state,
      action: PayloadAction<{ type: 'front' | 'back'; enabled: boolean }>
    ) => {
      const { type, enabled } = action.payload;
      if (type === 'front') {
        state.frontEnabled = enabled;
      } else {
        state.backEnabled = enabled;
      }
    },
    /*---------------------------------------
      Set selected cover page to redux state
    -----------------------------------------*/
    setTemplate: (state, action: PayloadAction<{ template: Template }>) => {
      const { template } = action.payload;

      template.type === 'front'
        ? (state.frontCoverPage = template)
        : (state.backCoverPage = template);
    },
    /*---------------------------------------
      Deselect Cover page from export option
    -----------------------------------------*/
    deSelectCoverPage: (state, action: PayloadAction<string>) => {
      const type = action.payload;
      if (type === 'Front') state.frontCoverPage = null;
      if (type === 'Back') state.backCoverPage = null;
    },
    setCoverPageHtml: (
      state,
      action: PayloadAction<{
        type: 'front' | 'back';
        html: string;
      }>
    ) => {
      const { type, html } = action.payload;
      if (type === 'front') {
        state.frontHtml = html;
      } else {
        state.backHtml = html;
      }
    },

    setCoverPageLexicalJson: (
      state,
      action: PayloadAction<{
        type: 'front' | 'back';
        lexicalJson: string;
      }>
    ) => {
      const { type, lexicalJson } = action.payload;
      if (type === 'front') {
        state.frontLexicalJson = lexicalJson;
      } else {
        state.backLexicalJson = lexicalJson;
      }
    },

    setCoverPageName: (
      state,
      action: PayloadAction<{ type: 'front' | 'back'; name: string }>
    ) => {
      const { type, name } = action.payload;
      if (type === 'front') {
        state.frontName = name;
      } else {
        state.backName = name;
      }
    },

    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },

    setBundleId: (state, action: PayloadAction<string>) => {
      state.currentBundleId = action.payload;
    },

    setCoverPageId: (
      state,
      action: PayloadAction<{ type: 'front' | 'back'; id: string | null }>
    ) => {
      const { type, id } = action.payload;
      if (type === 'front') {
        state.frontCoverPageId = id;
      } else {
        state.backCoverPageId = id;
      }
    },

    loadExistingCoverPageData: (
      state,
      action: PayloadAction<{
        type: 'front' | 'back';
        id: string;
        html: string;
        lexicalJson?: string | null;
        name?: string;
      }>
    ) => {
      const { type, id, html, lexicalJson, name } = action.payload;

      if (type === 'front') {
        state.frontCoverPageId = id;
        state.frontHtml = html || '';
        state.frontLexicalJson = lexicalJson || null;
        if (typeof name === 'string') {
          state.frontName = name;
        }
      } else {
        state.backCoverPageId = id;
        state.backHtml = html || '';
        state.backLexicalJson = lexicalJson || null;
        if (typeof name === 'string') {
          state.backName = name;
        }
      }
    },

    resetCoverPage: (
      state,
      action: PayloadAction<{ type: 'front' | 'back' }>
    ) => {
      const { type } = action.payload;

      if (type === 'front') {
        state.frontEnabled = false;
        state.frontCoverPageId = null;
        state.frontHtml = '';
        state.frontLexicalJson = null;
        state.frontName = '';
      } else {
        state.backEnabled = false;
        state.backCoverPageId = null;
        state.backHtml = '';
        state.backLexicalJson = null;
        state.backName = '';
      }
    },

    upsertTemplate: (state, action: PayloadAction<any>) => {
      const incoming = action.payload;
      const index = state.templates.findIndex(
        template => template.templateKey === incoming.templateKey
      );

      if (index >= 0) {
        state.templates[index] = {
          ...state.templates[index],
          ...incoming,
        };
      } else {
        state.templates.push(incoming);
      }
    },
  },
  extraReducers: builder => {
    builder
      // Save/update cover page data
      .addCase(saveCoverPageData.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveCoverPageData.fulfilled, (state, action) => {
        state.isSaving = false;
        const { type, response } = action.payload;
        // Update the current cover page ID if it was newly created
        if (response?.id) {
          if (type === 'front') {
            state.frontCoverPageId = response.id;
          } else {
            state.backCoverPageId = response.id;
          }
        }
        if (response?.name) {
          if (type === 'front') {
            state.frontName = response.name;
          } else {
            state.backName = response.name;
          }
        }
        if (response?.templateKey || response?.id) {
          const index = state.templates.findIndex(
            template =>
              template.templateKey === response.templateKey ||
              template.id === response.id
          );
          if (index >= 0) {
            state.templates[index] = {
              ...state.templates[index],
              name: response.name ?? state.templates[index].name,
              description:
                response.description ?? state.templates[index].description,
            };
          }
        }
      })
      .addCase(saveCoverPageData.rejected, state => {
        state.isSaving = false;
      })
      // Delete cover page
      .addCase(deleteCoverPage.pending, state => {
        state.isSaving = true;
      })
      .addCase(deleteCoverPage.fulfilled, (state, action) => {
        state.isSaving = false;
        const { id } = action.payload;
        const removed = state.templates.find(template => template.id === id);

        state.templates = state.templates.filter(
          template => template.id !== id
        );

        if (state.frontCoverPageId === id) {
          state.frontCoverPageId = null;
        }
        if (state.backCoverPageId === id) {
          state.backCoverPageId = null;
        }

        if (
          removed?.type === 'front' &&
          state.frontTemplateKey === removed.templateKey
        ) {
          state.frontTemplateKey = '';
          state.frontHtml = '';
          state.frontLexicalJson = null;
          state.frontName = '';
        }

        if (
          removed?.type === 'back' &&
          state.backTemplateKey === removed.templateKey
        ) {
          state.backTemplateKey = '';
          state.backHtml = '';
          state.backLexicalJson = null;
          state.backName = '';
        }
      })
      .addCase(deleteCoverPage.rejected, state => {
        state.isSaving = false;
      });
  },
});

export const {
  setEnabled,
  setTemplate,
  setCoverPageHtml,
  setCoverPageLexicalJson,
  setCoverPageName,
  setIsEditing,
  setBundleId,
  setCoverPageId,
  loadExistingCoverPageData,
  resetCoverPage,
  upsertTemplate,
  deSelectCoverPage,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
