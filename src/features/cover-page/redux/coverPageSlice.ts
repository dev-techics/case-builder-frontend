// redux/coverPageSlice.ts - Updated for HTML content
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { CoverPageApi } from '../api';

interface CoverPageState {
  frontEnabled: boolean;
  backEnabled: boolean;
  templates: any[];
  frontTemplateKey: string;
  backTemplateKey: string;
  frontHtml: string;
  backHtml: string;
  frontLexicalJson: string | null;
  backLexicalJson: string | null;
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
      templates,
    } = state.coverPage;

    const html = type === 'front' ? frontHtml : backHtml;
    const lexicalJson =
      type === 'front' ? frontLexicalJson : backLexicalJson;
    const templateKey = type === 'front' ? frontTemplateKey : backTemplateKey;
    const currentCoverPageId =
      type === 'front' ? frontCoverPageId : backCoverPageId;
    const selectedTemplate = templates.find(
      (template: any) => template.template_key === templateKey
    );
    const fallbackName =
      type === 'front' ? 'Front Cover Page' : 'Back Cover Page';

    const payload = {
      template_key: templateKey,
      html_content: html,
      lexical_json: lexicalJson || undefined,
      type: type,
      name: selectedTemplate?.name || fallbackName,
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

      if (type === 'front') {
        state.frontTemplateKey = templateKey;
      } else {
        state.backTemplateKey = templateKey;
      }

      // Find template and load default HTML if available
      const selectedTemplate = state.templates.find(
        template => template.template_key === templateKey
      );

      const templateHtml =
        selectedTemplate?.html_content ||
        selectedTemplate?.html ||
        selectedTemplate?.default_html ||
        '';
      const rawLexical =
        selectedTemplate?.lexical_json || selectedTemplate?.lexicalJson || null;
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
      }>
    ) => {
      const { type, id, html, lexicalJson } = action.payload;

      if (type === 'front') {
        state.frontCoverPageId = id;
        state.frontHtml = html || '';
        state.frontLexicalJson = lexicalJson || null;
      } else {
        state.backCoverPageId = id;
        state.backHtml = html || '';
        state.backLexicalJson = lexicalJson || null;
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
      } else {
        state.backEnabled = false;
        state.backCoverPageId = null;
        state.backHtml = '';
        state.backLexicalJson = null;
      }
    },

    upsertTemplate: (state, action: PayloadAction<any>) => {
      const incoming = action.payload;
      const index = state.templates.findIndex(
        template => template.template_key === incoming.template_key
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
                t.template_key === state.frontTemplateKey && t.type === 'front'
            ) || action.payload.find((t: any) => t.type === 'front');

          if (frontTemplate?.default_html && !state.frontHtml) {
            state.frontHtml = frontTemplate.default_html;
          }

          // Initialize back cover HTML
          const backTemplate =
            action.payload.find(
              (t: any) =>
                t.template_key === state.backTemplateKey && t.type === 'back'
            ) || action.payload.find((t: any) => t.type === 'back');

          if (backTemplate?.default_html && !state.backHtml) {
            state.backHtml = backTemplate.default_html;
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
      })
      .addCase(saveCoverPageData.rejected, state => {
        state.isSaving = false;
      });
  },
});

export const {
  setEnabled,
  setTemplate,
  setCoverPageHtml,
  setCoverPageLexicalJson,
  setIsEditing,
  setBundleId,
  setCoverPageId,
  loadExistingCoverPageData,
  resetCoverPage,
  upsertTemplate,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
