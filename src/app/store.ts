import { configureStore } from '@reduxjs/toolkit';
import editorReducer from '@/features/editor/redux/editorSlice';
import propertiesPanelReducer from '@/features/properties-panel/redux/propertiesPanelSlice';
import toolbarReducer from '@/features/toolbar/redux';
import fileTreeReducer from '../features/file-explorer/redux/fileTreeSlice';
import bundlesListReducer from '@/features/bundles-list/redux/bundlesListSlice';
import authReducer from '@/features/auth/redux/authSlice';
import CoverPageReducer from '@/features/cover-page/redux/coverPageSlice';
import authApi from '@/features/auth/api';
import coverPageApi from '@/features/cover-page/api';

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [coverPageApi.reducerPath]: coverPageApi.reducer,
    auth: authReducer,
    fileTree: fileTreeReducer,
    editor: editorReducer,
    propertiesPanel: propertiesPanelReducer,
    toolbar: toolbarReducer,
    bundleList: bundlesListReducer,
    coverPage: CoverPageReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(authApi.middleware, coverPageApi.middleware),
});

export default store;
// Export these types from the store file
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
