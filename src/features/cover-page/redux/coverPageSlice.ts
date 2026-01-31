// redux/coverPageSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { CoverPageApi } from '../api';

interface fields {
  name: string;
  value?: string; // Added value property
  x: number;
  y: number;
  font: string;
  size: number;
  align: 'left' | 'center' | 'right';
  bold: boolean;
}

interface Template {
  template_key: string;
  name: string;
  description: string;
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
  enabled: boolean;
  templates: Template[];
  templateKey: string;
  values: fields[]; // Changed from Record<string, any> to fields[]
  isEditing: boolean;
  isSaving: boolean;
  currentBundleId: string | null;
  currentCoverPageId: string | null; // Track current cover page being edited
}

const initialState: CoverPageState = {
  enabled: false,
  templates: [],
  templateKey: 'legal_cover_v1', // default selected template
  values: [],
  isEditing: false,
  isSaving: false,
  currentBundleId: null,
  currentCoverPageId: null,
};

// Load cover page data from backend
export const loadCoverPageTemplates = createAsyncThunk(
  'coverPage/loadCoverPageTemplates',
  async () => {
    const response = await CoverPageApi.getCoverPages();
    return response;
  }
);

// Save cover page id in bundle meta data
export const saveCoverPageIdInMetadata = createAsyncThunk(
  'coverPage/saveId',
  async (coverPageId: string, { getState }) => {
    const state = getState() as any;
    const { currentBundleId } = state.coverPage;

    if (!currentBundleId) {
      throw new Error('No bundle ID set');
    }

    const response = await CoverPageApi.updateMetadata(currentBundleId, {
      front_cover_page_id: coverPageId,
    });

    return response;
  }
);

// Save/update cover page data
export const saveCoverPageData = createAsyncThunk(
  'coverPage/saveData',
  async (_, { getState }) => {
    const state = getState() as any;
    const { values, templateKey, currentCoverPageId, templates } =
      state.coverPage;

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
          ...templateField, // Keep all original properties (x, y, font, size, align, bold)
          value: userField?.value || '', // Add/update only the value property
        };
      }
    );

    const payload = {
      template_key: templateKey,
      values: {
        page: selectedTemplate.values.page,
        fields: updatedFields,
      },
      type: 'front', // or 'back' depending on your use case
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

    return response;
  }
);

const coverPageSlice = createSlice({
  name: 'coverPage',
  initialState,
  reducers: {
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    setTemplate: (state, action: PayloadAction<string>) => {
      state.templateKey = action.payload;

      const selectedTemplate = state.templates.find(
        template => template.template_key === action.payload
      );

      // Initialize values array with field structure and empty values
      state.values =
        selectedTemplate?.values?.fields.map(field => ({
          ...field,
          value: '', // Initialize with empty string
        })) ?? [];
    },

    setFieldValue: (
      state,
      action: PayloadAction<{ field: string; value: string }>
    ) => {
      const fieldIndex = state.values.findIndex(
        field => field.name === action.payload.field
      );

      if (fieldIndex !== -1) {
        state.values[fieldIndex].value = action.payload.value;
      }
    },

    setAllValues: (state, action: PayloadAction<fields[]>) => {
      state.values = action.payload;
    },

    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },

    setBundleId: (state, action: PayloadAction<string>) => {
      state.currentBundleId = action.payload;
    },

    setCoverPageId: (state, action: PayloadAction<string | null>) => {
      state.currentCoverPageId = action.payload;
    },

    loadExistingCoverPageData: (
      state,
      action: PayloadAction<{
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
      state.currentCoverPageId = action.payload.id;

      // Use the fields from the loaded cover page directly
      // They already have the full structure with values
      state.values = action.payload.values.fields || [];
    },

    resetCoverPage: state => {
      state.enabled = false;
      state.currentCoverPageId = null;
      const selectedTemplate = state.templates.find(
        template => template.template_key === state.templateKey
      );
      state.values =
        selectedTemplate?.values?.fields.map(field => ({
          ...field,
          value: '',
        })) ?? [];
    },
  },
  extraReducers: builder => {
    builder
      // Load templates
      .addCase(loadCoverPageTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;

        // Initialize values when templates are loaded
        if (action.payload.length > 0) {
          const defaultTemplate =
            action.payload.find(
              (t: any) => t.template_key === state.templateKey
            ) || action.payload[0];

          state.values = defaultTemplate.values.fields.map((field: any) => ({
            ...field,
            value: '',
          }));
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
      // Save/update cover page data
      .addCase(saveCoverPageData.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveCoverPageData.fulfilled, (state, action) => {
        state.isSaving = false;
        // Update the current cover page ID if it was newly created
        if (action.payload?.id) {
          state.currentCoverPageId = action.payload.id;
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
