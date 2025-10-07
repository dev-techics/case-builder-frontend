import { configureStore } from "@reduxjs/toolkit";
import editorSlice from "@/features/editor/editorSlice";
import propertiesPanelSlice from "@/features/properties-panel/propertiesPanelSlice";
import fileTreeSlice from "../features/file-explorer/fileTreeSlice";

const store = configureStore({
  reducer: {
    fileTree: fileTreeSlice,
    editor: editorSlice,
    propertiesPanel: propertiesPanelSlice,
  },
});

export default store;
// Export these types from the store file
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
