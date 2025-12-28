import { configureStore } from '@reduxjs/toolkit';
import indexGenerator from '@/features/auto-index/autoIndexSlice';
import editorSlice from '@/features/editor/editorSlice';
import propertiesPanelSlice from '@/features/properties-panel/propertiesPanelSlice';
import toolbar from '@/features/toolbar/toolbarSlice';
import fileTreeSlice from '../features/file-explorer/fileTreeSlice';
import bundlesListSlice from '@/features/bundles-list/redux/bundlesListSlice';
import authReducer from '@/features/auth/redux/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    fileTree: fileTreeSlice,
    editor: editorSlice,
    propertiesPanel: propertiesPanelSlice,
    toolbar,
    indexGenerator,
    bundleList: bundlesListSlice,
  },
});

export default store;
// Export these types from the store file
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
