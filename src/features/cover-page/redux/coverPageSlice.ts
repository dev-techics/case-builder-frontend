// redux/coverPageSlice.ts - Updated for HTML content
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { CoverPageApi } from '../api';
import type { Template } from '../types';

interface CoverPageState {
  frontEnabled: boolean;
  backEnabled: boolean;
  templates: Template[];
  //! why are we storing template keys in the state? We can directly store the selected template id and find the template details from the templates array when needed. This will simplify the state and reduce redundancy.
  frontTemplateKey: string;
  backTemplateKey: string;
  frontHtml: string;
  backHtml: string;
  frontLexicalJson: string | null;
  backLexicalJson: string | null;
  frontName: string;
  backName: string;

  isEditing: boolean;
  isSaving: boolean;
  currentBundleId: string | null;
  frontCoverPageId: string | null;
  backCoverPageId: string | null;
}

const initialState: CoverPageState = {
  frontEnabled: false,
  backEnabled: false,
  templates: [],
  frontTemplateKey: 'legal_cover_v1',
  backTemplateKey: 'legal_back_cover_v1',
  frontHtml: '',
  backHtml: '',
  frontLexicalJson: null,
  backLexicalJson: null,
  frontName: '',
  backName: '',
  isEditing: false,
  isSaving: false,
  currentBundleId: null,
  frontCoverPageId: null,
  backCoverPageId: null,
};

// Load cover page templates
export const loadCoverPageTemplates = createAsyncThunk(
  'coverPage/loadCoverPageTemplates',
  async () => {
    const response = await CoverPageApi.getCoverPages();
    console.log('API response for cover pages:', response);
    return response;
  }
);

// Save cover page id in bundle metadata
export const saveCoverPageIdInMetadata = createAsyncThunk(
  'coverPage/saveId',
  async (
    { type, coverPageId }: { type: 'front' | 'back'; coverPageId: string },
    { getState }
  ) => {
    const state = getState() as any;
    const { currentBundleId } = state.coverPage;

    if (!currentBundleId) {
      throw new Error('No bundle ID set');
    }

    const metadataKey =
      type === 'front' ? 'front_cover_page_id' : 'back_cover_page_id';

    const response = await CoverPageApi.updateMetadata(currentBundleId, {
      [metadataKey]: coverPageId.toString(),
    });

    return { type, response };
  }
);

// Remove cover page id from bundle metadata
export const removeCoverPageIdFromMetadata = createAsyncThunk(
  'coverPage/removeId',
  async (type: 'front' | 'back', { getState }) => {
    const state = getState() as any;
    const { currentBundleId } = state.coverPage;

    if (!currentBundleId) {
      throw new Error('No bundle ID set');
    }

    const metadataKey =
      type === 'front' ? 'front_cover_page_id' : 'back_cover_page_id';

    const response = await CoverPageApi.updateMetadata(currentBundleId, {
      [metadataKey]: null,
    });

    return { type, response };
  }
);

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

    if (currentBundleId && (id === frontCoverPageId || id === backCoverPageId)) {
      await CoverPageApi.updateMetadata(currentBundleId, {
        ...(id === frontCoverPageId
          ? { front_cover_page_id: null }
          : {}),
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

    setTemplate: (
      state,
      action: PayloadAction<{ type: 'front' | 'back'; templateKey: string }>
    ) => {
      const { type, templateKey } = action.payload;

      // Find template and load default HTML if available
      const selectedTemplate = state.templates.find(
        template => template.templateKey === templateKey
      );

      const fallbackName =
        type === 'front' ? 'Front Cover Page' : 'Back Cover Page';
      const nextName = selectedTemplate?.name || fallbackName;

      if (type === 'front') {
        state.frontTemplateKey = templateKey;
        state.frontName = nextName;
      } else {
        state.backTemplateKey = templateKey;
        state.backName = nextName;
      }

      const templateHtml = selectedTemplate?.html || '';

      const rawLexical = selectedTemplate?.lexicalJson || null;

      const normalizedLexical =
        rawLexical && typeof rawLexical !== 'string'
          ? JSON.stringify(rawLexical)
          : rawLexical;

      if (type === 'front') {
        state.frontHtml = templateHtml;
        state.frontLexicalJson = normalizedLexical;
        state.frontCoverPageId = selectedTemplate?.id || null;
      } else {
        state.backHtml = templateHtml;
        state.backLexicalJson = normalizedLexical;
        state.backCoverPageId = selectedTemplate?.id || null;
      }
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
      // Load templates
      .addCase(loadCoverPageTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;

        // Initialize HTML when templates are loaded
        if (action.payload.length > 0) {
          // Initialize front cover HTML
          const frontTemplate =
            action.payload.find(
              (t: any) =>
                t.templateKey === state.frontTemplateKey && t.type === 'front'
            ) || action.payload.find((t: any) => t.type === 'front');

          if (frontTemplate?.isDefault && !state.frontHtml) {
            state.frontHtml = frontTemplate.html;
          }
          if (!state.frontName) {
            state.frontName = frontTemplate?.name || 'Front Cover Page';
          }

          // Initialize back cover HTML
          const backTemplate =
            action.payload.find(
              (t: any) =>
                t.templateKey === state.backTemplateKey && t.type === 'back'
            ) || action.payload.find((t: any) => t.type === 'back');

          if (backTemplate?.isDefault && !state.backHtml) {
            state.backHtml = backTemplate.html;
          }
          if (!state.backName) {
            state.backName = backTemplate?.name || 'Back Cover Page';
          }
        }
      })
      // Save cover page ID in metadata
      .addCase(saveCoverPageIdInMetadata.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveCoverPageIdInMetadata.fulfilled, state => {
        state.isSaving = false;
      })
      .addCase(saveCoverPageIdInMetadata.rejected, state => {
        state.isSaving = false;
      })
      // Remove cover page ID from metadata
      .addCase(removeCoverPageIdFromMetadata.pending, state => {
        state.isSaving = true;
      })
      .addCase(removeCoverPageIdFromMetadata.fulfilled, (state, action) => {
        state.isSaving = false;
        const { type } = action.payload;
        if (type === 'front') {
          state.frontCoverPageId = null;
        } else {
          state.backCoverPageId = null;
        }
      })
      .addCase(removeCoverPageIdFromMetadata.rejected, state => {
        state.isSaving = false;
      })
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
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
