// redux/coverPageSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { CoverPageApi } from '../api';

interface fields {
  name: string;
  value?: string;
  x: number;
  y: number;
  font: string;
  size: number;
  align: 'left' | 'center' | 'right';
  bold: boolean;
}

interface Template {
  id: string;
  template_key: string;
  name: string;
  description: string;
  type: 'front' | 'back'; // Add type to template
  values: {
    page: {
      size: string;
      margin: number;
      orientation: string;
    };
    fields: fields[];
  };
}

interface CoverPageState {
  frontEnabled: boolean;
  backEnabled: boolean;
  templates: Template[];
  frontTemplateKey: string;
  backTemplateKey: string;
  frontValues: fields[];
  backValues: fields[];
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
  frontValues: [],
  backValues: [],
  isEditing: false,
  isSaving: false,
  currentBundleId: null,
  frontCoverPageId: null,
  backCoverPageId: null,
};

// Load cover page data from backend
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

// Save/update cover page data
export const saveCoverPageData = createAsyncThunk(
  'coverPage/saveData',
  async (type: 'front' | 'back', { getState }) => {
    const state = getState() as any;
    const {
      frontValues,
      backValues,
      frontTemplateKey,
      backTemplateKey,
      frontCoverPageId,
      backCoverPageId,
      templates,
    } = state.coverPage;

    const values = type === 'front' ? frontValues : backValues;
    const templateKey = type === 'front' ? frontTemplateKey : backTemplateKey;
    const currentCoverPageId =
      type === 'front' ? frontCoverPageId : backCoverPageId;

    // Get the template structure
    const selectedTemplate = templates.find(
      (template: any) => template.template_key === templateKey
    );

    if (!selectedTemplate) {
      throw new Error('Template not found');
    }

    // Preserve the full field structure and merge with user values
    const updatedFields = selectedTemplate.values.fields.map(
      (templateField: any) => {
        const userField = values.find(
          (v: any) => v.name === templateField.name
        );
        return {
          ...templateField,
          value: userField?.value || '',
        };
      }
    );

    const payload = {
      template_key: templateKey,
      values: {
        page: selectedTemplate.values.page,
        fields: updatedFields,
      },
      type: type,
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

      const selectedTemplate = state.templates.find(
        template => template.template_key === templateKey
      );

      // Initialize values array with field structure and empty values
      const initialValues =
        selectedTemplate?.values?.fields.map(field => ({
          ...field,
          value: '',
        })) ?? [];

      if (type === 'front') {
        state.frontValues = initialValues;
      } else {
        state.backValues = initialValues;
      }
    },

    setFieldValue: (
      state,
      action: PayloadAction<{
        type: 'front' | 'back';
        field: string;
        value: string;
      }>
    ) => {
      const { type, field, value } = action.payload;
      const values = type === 'front' ? state.frontValues : state.backValues;

      const fieldIndex = values.findIndex(f => f.name === field);

      if (fieldIndex !== -1) {
        if (type === 'front') {
          state.frontValues[fieldIndex].value = value;
        } else {
          state.backValues[fieldIndex].value = value;
        }
      }
    },

    setAllValues: (
      state,
      action: PayloadAction<{ type: 'front' | 'back'; values: fields[] }>
    ) => {
      const { type, values } = action.payload;
      if (type === 'front') {
        state.frontValues = values;
      } else {
        state.backValues = values;
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
        values: {
          page: {
            size: string;
            margin: number;
            orientation: string;
          };
          fields: fields[];
        };
      }>
    ) => {
      const { type, id, values } = action.payload;

      if (type === 'front') {
        state.frontCoverPageId = id;
        state.frontValues = values.fields || [];
      } else {
        state.backCoverPageId = id;
        state.backValues = values.fields || [];
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
        const selectedTemplate = state.templates.find(
          template => template.template_key === state.frontTemplateKey
        );
        state.frontValues =
          selectedTemplate?.values?.fields.map(field => ({
            ...field,
            value: '',
          })) ?? [];
      } else {
        state.backEnabled = false;
        state.backCoverPageId = null;
        const selectedTemplate = state.templates.find(
          template => template.template_key === state.backTemplateKey
        );
        state.backValues =
          selectedTemplate?.values?.fields.map(field => ({
            ...field,
            value: '',
          })) ?? [];
      }
    },
  },
  extraReducers: builder => {
    builder
      // Load templates
      .addCase(loadCoverPageTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;

        // Initialize values when templates are loaded
        if (action.payload.length > 0) {
          // Initialize front cover values
          const frontTemplate =
            action.payload.find(
              (t: any) =>
                t.template_key === state.frontTemplateKey && t.type === 'front'
            ) || action.payload.find((t: any) => t.type === 'front');

          if (frontTemplate) {
            state.frontValues = frontTemplate.values.fields.map(
              (field: any) => ({
                ...field,
                value: '',
              })
            );
          }

          // Initialize back cover values
          const backTemplate =
            action.payload.find(
              (t: any) =>
                t.template_key === state.backTemplateKey && t.type === 'back'
            ) || action.payload.find((t: any) => t.type === 'back');

          if (backTemplate) {
            state.backValues = backTemplate.values.fields.map((field: any) => ({
              ...field,
              value: '',
            }));
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
  setFieldValue,
  setAllValues,
  setIsEditing,
  setBundleId,
  setCoverPageId,
  loadExistingCoverPageData,
  resetCoverPage,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
