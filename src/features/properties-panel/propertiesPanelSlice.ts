import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
};

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
});

export const {
  changeHeaderLeft,
  changeHeaderRight,
  changeFooter,
  setDocumentPageCount,
  removeDocumentPageCount,
  clearDocumentInfo,
  toggleRightSidebar,
} = propertiesPanelSlice.actions;

export default propertiesPanelSlice.reducer;
