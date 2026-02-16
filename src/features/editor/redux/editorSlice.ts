import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Highlight } from '@/features/toolbar/types/types';

type PendingHighlight = {
  fileId: string;
  pageNumber: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
};

type EditorState = {
  scale: number;
  maxScale: number;
  colorPickerPosition: { x: number | null; y: number | null };
  pendingHighlight: PendingHighlight | null;
  highlights: Highlight[]; // Array to store multiple highlights
};

const initialState: EditorState = {
  scale: 1.0,
  maxScale: 3.0,
  colorPickerPosition: { x: null, y: null },
  pendingHighlight: null,
  highlights: [],
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // Scale controls
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = Math.min(
        Math.max(action.payload, 0.5),
        state.maxScale
      );
    },
    setMaxScale: (state, action: PayloadAction<number>) => {
      state.maxScale = Math.min(Math.max(action.payload, 0.5), 3.0);
      if (state.scale > state.maxScale) {
        state.scale = state.maxScale;
      }
    },
    zoomIn: state => {
      state.scale = Math.min(state.scale + 0.2, state.maxScale);
    },
    zoomOut: state => {
      state.scale = Math.max(state.scale - 0.2, 0.5);
    },

    // Color picker position
    setColorPickerPosition: (
      state,
      action: PayloadAction<{ x: number | null; y: number | null }>
    ) => {
      state.colorPickerPosition = action.payload;
    },

    // Store pending highlight (before color is selected)
    setPendingHighlight: (
      state,
      action: PayloadAction<PendingHighlight | null>
    ) => {
      state.pendingHighlight = action.payload;
    },

    // Add highlight (after color is selected)
    addHighlight: (state, action: PayloadAction<Highlight>) => {
      state.highlights.push(action.payload);
    },

    // Remove a specific highlight
    removeHighlight: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(h => h.id !== action.payload);
    },

    // Clear all highlights
    clearHighlights: state => {
      state.highlights = [];
    },

    // Clear highlights for a specific file
    clearFileHighlights: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(
        h => h.fileId !== action.payload
      );
    },

    // Clear highlights for a specific page
    clearPageHighlights: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.highlights = state.highlights.filter(
        h =>
          h.fileId !== action.payload.fileId ||
          h.pageNumber !== action.payload.pageNumber
      );
    },

    // Cancel highlight creation
    cancelHighlight: state => {
      state.colorPickerPosition = { x: null, y: null };
      state.pendingHighlight = null;
    },
  },
});

export const {
  setScale,
  setMaxScale,
  zoomIn,
  zoomOut,
  setColorPickerPosition,
  setPendingHighlight,
  addHighlight,
  removeHighlight,
  clearHighlights,
  clearFileHighlights,
  clearPageHighlights,
  cancelHighlight,
} = editorSlice.actions;

export default editorSlice.reducer;
