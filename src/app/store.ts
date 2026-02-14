import { configureStore } from '@reduxjs/toolkit';
import indexGeneratorReducer from '@/features/auto-index/autoIndexSlice';
import editorReducer from '@/features/editor/redux/editorSlice';
import propertiesPanelReducer from '@/features/properties-panel/redux/propertiesPanelSlice';
import toolbarReducer from '@/features/toolbar/toolbarSlice';
import fileTreeReducer from '../features/file-explorer/redux/fileTreeSlice';
import bundlesListReducer from '@/features/bundles-list/redux/bundlesListSlice';
import authReducer from '@/features/auth/redux/authSlice';
import CoverPageReducer from '@/features/cover-page/redux/coverPageSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    fileTree: fileTreeReducer,
    editor: editorReducer,
    propertiesPanel: propertiesPanelReducer,
    toolbar: toolbarReducer,
    indexGenerator: indexGeneratorReducer,
    bundleList: bundlesListReducer,
    coverPage: CoverPageReducer,
  },
});

export default store;
// Export these types from the store file
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
