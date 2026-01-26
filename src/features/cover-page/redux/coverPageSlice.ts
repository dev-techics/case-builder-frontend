// redux/coverPageSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { BundleApiService } from '@/api/axiosInstance';
import type { CoverPageData } from '../types';
import { DEFAULT_COVER_VALUES } from '../constants/coverTemplates';

interface CoverPageState {
  enabled: boolean;
  templateKey: string;
  values: Record<string, string>;
  isEditing: boolean;
  isSaving: boolean;
  currentBundleId: string | null;
}

const initialState: CoverPageState = {
  enabled: false,
  templateKey: 'legal_cover_v1',
  values: DEFAULT_COVER_VALUES.legal_cover_v1,
  isEditing: false,
  isSaving: false,
  currentBundleId: null,
};

// Load cover page data from backend
export const loadCoverPageData = createAsyncThunk(
  'coverPage/load',
  async (bundleId: string) => {
    const response = await BundleApiService.getBundle(bundleId);
    return {
      bundleId,
      coverPage: response.metadata?.cover_page || null,
    };
  }
);

// Save cover page data to backend
export const saveCoverPageData = createAsyncThunk(
  'coverPage/save',
  async (_, { getState }) => {
    const state = getState() as any;
    const { enabled, templateKey, values, currentBundleId } = state.coverPage;

    if (!currentBundleId) {
      throw new Error('No bundle ID set');
    }

    const coverPageData: CoverPageData = {
      template_key: templateKey,
      enabled,
      values,
    };

    await BundleApiService.updateMetadata(currentBundleId, {
      cover_page: coverPageData,
    });

    return coverPageData;
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
      .addCase(loadCoverPageData.fulfilled, (state, action) => {
        const { coverPage, bundleId } = action.payload;
        state.currentBundleId = bundleId;

        if (coverPage) {
          state.enabled = coverPage.enabled;
          state.templateKey = coverPage.template_key;
          state.values = coverPage.values;
        }
      })
      // Save
      .addCase(saveCoverPageData.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveCoverPageData.fulfilled, state => {
        state.isSaving = false;
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
  resetCoverPage,
} = coverPageSlice.actions;

export default coverPageSlice.reducer;
