import { BundleApiService } from '@/api/axiosInstance';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

type HeaderFooterItem = {
  text: string;
  color: string;
  size: number;
};

type DocumentPageInfo = {
  numPages: number;
  fileName?: string;
};

type PropertiesPanelState = {
  headersFooter: {
    headerLeft: HeaderFooterItem;
    headerRight: HeaderFooterItem;
    footer: HeaderFooterItem;
  };
  documentInfo: Record<string, DocumentPageInfo>; // Changed from array to object
  openRightSidebar: boolean;
  currentBundleId: string | null;
  isSaving: boolean;
  lastSaved: string | null;
};

const initialState: PropertiesPanelState = {
  headersFooter: {
    headerLeft: {
      text: 'Header Left',
      color: '#000',
      size: 10,
    },
    headerRight: {
      text: 'Header Right',
      color: '#000',
      size: 10,
    },
    footer: {
      text: 'ICS Legal',
      color: '#000',
      size: 10,
    },
  },
  documentInfo: {}, // Changed to empty object
  openRightSidebar: true,
  currentBundleId: null,
  isSaving: false,
  lastSaved: null,
};

// Async thunk to save metadata to backend
export const saveMetadataToBackend = createAsyncThunk(
  'propertiesPanel/saveMetadata',
  async (_, { getState }) => {
    const state = getState() as any;
    const { headersFooter, currentBundleId } = state.propertiesPanel;

    if (!currentBundleId) {
      throw new Error('No bundle ID set');
    }

    const response = await BundleApiService.updateMetadata(currentBundleId, {
      header_left: headersFooter.headerLeft.text,
      header_right: headersFooter.headerRight.text,
      footer: headersFooter.footer.text,
    });

    return response;
  }
);

// Async thunk to load metadata from backend
export const loadMetadataFromBackend = createAsyncThunk(
  'propertiesPanel/loadMetadata',
  async (bundleId: string) => {
    const response = await BundleApiService.getBundle(bundleId);
    return {
      bundleId,
      metadata: response.metadata || {},
    };
  }
);

const propertiesPanelSlice = createSlice({
  name: 'propertiesPanel',
  initialState,
  reducers: {
    changeHeaderLeft: (state, action: PayloadAction<string>) => {
      state.headersFooter.headerLeft.text = action.payload;
    },
    changeHeaderRight: (state, action: PayloadAction<string>) => {
      state.headersFooter.headerRight.text = action.payload;
    },
    changeFooter: (state, action: PayloadAction<string>) => {
      state.headersFooter.footer.text = action.payload;
    },
    // New action to set document page count
    setDocumentPageCount: (
      state,
      action: PayloadAction<{
        fileId: string;
        numPages: number;
        fileName?: string;
      }>
    ) => {
      state.documentInfo[action.payload.fileId] = {
        numPages: action.payload.numPages,
        fileName: action.payload.fileName,
      };
    },
    setCurrentBundleId: (state, action: PayloadAction<string>) => {
      state.currentBundleId = action.payload;
    },
    // Clear document info when files are deleted
    removeDocumentPageCount: (state, action: PayloadAction<string>) => {
      delete state.documentInfo[action.payload];
    },
    // Clear all document info
    clearDocumentInfo: state => {
      state.documentInfo = {};
    },
    toggleRightSidebar: (state, action: PayloadAction<boolean>) => {
      state.openRightSidebar = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Save metadata
      .addCase(saveMetadataToBackend.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveMetadataToBackend.fulfilled, state => {
        state.isSaving = false;
        state.lastSaved = new Date().toISOString();
      })
      .addCase(saveMetadataToBackend.rejected, state => {
        state.isSaving = false;
      })
      // Load metadata
      .addCase(loadMetadataFromBackend.fulfilled, (state, action) => {
        const { metadata, bundleId } = action.payload;
        state.currentBundleId = bundleId;
        state.headersFooter.headerLeft.text = metadata.header_left || '';
        state.headersFooter.headerRight.text = metadata.header_right || '';
        state.headersFooter.footer.text = metadata.footer || '';
      });
  },
});

export const {
  changeHeaderLeft,
  changeHeaderRight,
  changeFooter,
  setDocumentPageCount,
  setCurrentBundleId,
  removeDocumentPageCount,
  clearDocumentInfo,
  toggleRightSidebar,
} = propertiesPanelSlice.actions;

export default propertiesPanelSlice.reducer;
