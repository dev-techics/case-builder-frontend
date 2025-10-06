import { createSlice } from "@reduxjs/toolkit";

const editorSlice = createSlice({
  name: "editor",
  initialState: {
    scale: 1.0,
  },
  reducers: {
    setScale: (state, action) => {
      state.scale = Math.min(Math.max(action.payload, 0.5), 3.0); // Clamp between 0.5 and 3.0
    },
    zoomIn: (state) => {
      state.scale = Math.min(state.scale + 0.2, 3.0);
    },
    zoomOut: (state) => {
      state.scale = Math.min(state.scale - 0.2, 0.5);
    },
  },
});

export const { setScale, zoomIn, zoomOut } = editorSlice.actions;
export default editorSlice.reducer;
