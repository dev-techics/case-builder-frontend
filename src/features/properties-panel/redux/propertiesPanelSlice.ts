import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { propertiesPanelApi, type PropertiesPanelMetadata } from '../api';

type HeaderFooterItem = {
  text: string;
  color: string;
  size: number;
};

type HeaderFooterField = 'headerLeft' | 'headerRight' | 'footer';

type AnnotationValues = Record<HeaderFooterField, string>;

type UpdateAnnotationsPayload =
  | {
      type: 'reset';
    }
  | {
      type: 'blur';
      annotation: { field: HeaderFooterField; value: string };
    }
  | {
      type: 'save';
      annotations: AnnotationValues;
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

const clearMetadata = (state: PropertiesPanelState) => {
  state.headersFooter.headerLeft.text = '';
  state.headersFooter.headerRight.text = '';
  state.headersFooter.footer.text = '';
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

const applyMetadata = (
  state: PropertiesPanelState,
  metadata: PropertiesPanelMetadata
) => {
  state.headersFooter.headerLeft.text = metadata.headerLeft || '';
  state.headersFooter.headerRight.text = metadata.headerRight || '';
  state.headersFooter.footer.text = metadata.footer || '';
};

const propertiesPanelSlice = createSlice({
  name: 'propertiesPanel',
  initialState,
  reducers: {
    updateAnnotations: (
      state,
      action: PayloadAction<UpdateAnnotationsPayload>
    ) => {
      if (action.payload.type === 'reset') {
        clearMetadata(state);
        return;
      }

      if (action.payload.type === 'blur') {
        const { field, value } = action.payload.annotation;
        state.headersFooter[field].text = value;
        return;
      }

      state.headersFooter.headerLeft.text =
        action.payload.annotations.headerLeft;
      state.headersFooter.headerRight.text =
        action.payload.annotations.headerRight;
      state.headersFooter.footer.text = action.payload.annotations.footer;
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
    setCurrentBundleId: (state, action: PayloadAction<string | null>) => {
      if (state.currentBundleId !== action.payload) {
        clearMetadata(state);
        state.lastSaved = null;
      }
      state.currentBundleId = action.payload;
    },
    syncMetadataFromBackend: (
      state,
      action: PayloadAction<{
        bundleId: string;
        metadata: PropertiesPanelMetadata;
      }>
    ) => {
      state.currentBundleId = action.payload.bundleId;
      applyMetadata(state, action.payload.metadata);
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
      .addMatcher(
        propertiesPanelApi.endpoints.saveMetaData.matchPending,
        state => {
          state.isSaving = true;
        }
      )
      .addMatcher(
        propertiesPanelApi.endpoints.saveMetaData.matchFulfilled,
        state => {
          state.isSaving = false;
          state.lastSaved = new Date().toISOString();
        }
      )
      .addMatcher(
        propertiesPanelApi.endpoints.saveMetaData.matchRejected,
        state => {
          state.isSaving = false;
        }
      );
  },
});

export const {
  updateAnnotations,
  setDocumentPageCount,
  setCurrentBundleId,
  syncMetadataFromBackend,
  removeDocumentPageCount,
  clearDocumentInfo,
  toggleRightSidebar,
} = propertiesPanelSlice.actions;

export default propertiesPanelSlice.reducer;
