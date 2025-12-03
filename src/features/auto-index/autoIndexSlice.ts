// features/index-generator/indexSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IndexEntry, IndexState } from "./types";

const initialState: IndexState = {
  entries: [],
  lastUpdated: "",
};

const indexSlice = createSlice({
  name: "indexGenerator",
  initialState,
  reducers: {
    // Regenerate entire index
    generateIndex: (state, action: PayloadAction<IndexEntry[]>) => {
      state.entries = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Update single entry when file is renamed
    updateIndexEntry: (
      state,
      action: PayloadAction<{ fileId: string; fileName: string }>
    ) => {
      const entry = state.entries.find(
        (e) => e.fileId === action.payload.fileId
      );
      if (entry) {
        entry.fileName = action.payload.fileName;
        state.lastUpdated = new Date().toISOString();
      }
    },

    // Clear index
    clearIndex: (state) => {
      state.entries = [];
      state.lastUpdated = "";
    },
  },
});

export default indexSlice.reducer;
export const { generateIndex, updateIndexEntry, clearIndex } =
  indexSlice.actions;
