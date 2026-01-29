// redux/coverPageSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { DEFAULT_COVER_VALUES } from '../constants/coverTemplates';
import { CoverPageApi } from '../api';

interface fields {
  name: string;
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
  values: Record<string, string>;
  isEditing: boolean;
  isSaving: boolean;
  currentBundleId: string | null;
}

const initialState: CoverPageState = {
  enabled: false,
  templates: [],
  templateKey: 'legal_cover_v1',
  values: {},
  isEditing: false,
  isSaving: false,
  currentBundleId: null,
};

// Load cover page data from backend
export const loadCoverPageTemplates = createAsyncThunk(
  'coverPage/loadCoverPageTemplates',
  async () => {
    const response = await CoverPageApi.getCoverPages();
    return response;
  }
);

// Save cover page data to backend
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

const coverPageSlice = createSlice({
  name: 'coverPage',
  initialState,
  reducers: {
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    setTemplate: (state, action: PayloadAction<string>) => {
      state.templateKey = action.payload;
      // Reset to default values for new template
      state.values = DEFAULT_COVER_VALUES[action.payload] || {};
    },
    setFieldValue: (
      state,
      action: PayloadAction<{ field: string; value: string }>
    ) => {
      state.values[action.payload.field] = action.payload.value;
    },
    setAllValues: (state, action: PayloadAction<Record<string, string>>) => {
      state.values = action.payload;
    },
    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    setBundleId: (state, action: PayloadAction<string>) => {
      state.currentBundleId = action.payload;
    },
    resetCoverPage: state => {
      state.enabled = false;
      state.values = DEFAULT_COVER_VALUES[state.templateKey] || {};
    },
  },
  extraReducers: builder => {
    builder
      // Load
      .addCase(loadCoverPageTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })
      // Save cover page ID
      .addCase(saveCoverPageIdInMetadata.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveCoverPageIdInMetadata.fulfilled, state => {
        state.isSaving = false;
      })
      .addCase(saveCoverPageIdInMetadata.rejected, state => {
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
  resetCoverPage,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
