import { createSlice } from "@reduxjs/toolkit";

const propertiesPanelSlice = createSlice({
  name: "fileProperties",
  initialState: {
    headersFooter: {
      headerLeft: "Header Left",
      headerRight: "Header Right",
      footer: "ICS Legal",
    },
    documentInfo: [],
  },
  reducers: {
    changeHeaderLeft: (state, action) => {
      state.headersFooter.headerLeft = action.payload;
    },
    changeHeaderRight: (state, action) => {
      state.headersFooter.headerRight = action.payload;
    },
    changeFooter: (state, action) => {
      state.headersFooter.footer = action.payload;
    },
  },
});
export const { changeHeaderLeft, changeHeaderRight, changeFooter } =
  propertiesPanelSlice.actions;
export default propertiesPanelSlice.reducer;
