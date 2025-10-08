import { createSlice } from "@reduxjs/toolkit";

const propertiesPanelSlice = createSlice({
  name: "fileProperties",
  initialState: {
    headersFooter: {
      headerLeft: {
        text: "Header Left",
        color: "#000",
        size: 10,
      },
      headerRight: {
        text: "Header Right",
        color: "#000",
        size: 10,
      },
      footer: {
        text: "ICS Legal",
        color: "#000",
        size: 10,
      },
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
