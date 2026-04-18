import { createSlice } from '@reduxjs/toolkit';

// Bundle server state now lives in RTK Query.
// Keep this slice available for future UI-only bundle list state.
type BundlesListState = Record<string, never>;

const initialState: BundlesListState = {};

const bundlesListSlice = createSlice({
  name: 'bundleList',
  initialState,
  reducers: {},
});

export default bundlesListSlice.reducer;
