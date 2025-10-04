import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchFileTree = createAsyncThunk("fileTree/fetch", async () => {
  const response = await fetch("/data/project-folder-data.json"); // mock API
  return await response.json();
});

const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: {
    data: null,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFileTree.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFileTree.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchFileTree.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load file tree";
      });
  },
});

export default fileTreeSlice.reducer;
