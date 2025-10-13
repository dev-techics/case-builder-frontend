import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  EditorState,
  Highlight,
  PendingHighlight,
} from "./types/SliceTypes";

const initialState: EditorState = {
  ToolbarPosition: { x: null, y: null },
  pendingHighlight: null,
  highlights: [],
  comments: [],
};

const toolbarSlice = createSlice({
  name: "toolbar",
  initialState,
  reducers: {
    // Color picker position
    setToolbarPosition: (
      state,
      action: PayloadAction<{ x: number | null; y: number | null }>
    ) => {
      state.ToolbarPosition = action.payload;
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
      state.highlights = state.highlights.filter(
        (h) => h.id !== action.payload
      );
    },

    // Clear all highlights
    clearHighlights: (state) => {
      state.highlights = [];
    },

    // Clear highlights for a specific file
    clearFileHighlights: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(
        (h) => h.fileId !== action.payload
      );
    },

    // Clear highlights for a specific page
    clearPageHighlights: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.highlights = state.highlights.filter(
        (h) =>
          h.fileId !== action.payload.fileId ||
          h.pageNumber !== action.payload.pageNumber
      );
    },

    // Cancel highlight creation
    cancelHighlight: (state) => {
      state.ToolbarPosition = { x: null, y: null };
      state.pendingHighlight = null;
    },
  },
});

export default toolbarSlice.reducer;
export const {
  setToolbarPosition,
  setPendingHighlight,
  addHighlight,
  removeHighlight,
  clearHighlights,
  clearFileHighlights,
  clearPageHighlights,
  cancelHighlight,
} = toolbarSlice.actions;
