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
import { fileTreeApi } from '@/features/file-explorer/api';
import { editorApi } from '@/features/editor/api';
import { dashboardApi } from '@/features/dashboard/api';
import dashboardReducer from '@/features/dashboard/redux';

const store = configureStore({
  reducer: {
    /*-------- Api slices --------- */
    [authApi.reducerPath]: authApi.reducer,
    [coverPageApi.reducerPath]: coverPageApi.reducer,
    [fileTreeApi.reducerPath]: fileTreeApi.reducer,
    [editorApi.reducerPath]: editorApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    /*----------- state slices ------------ */
    auth: authReducer,
    fileTree: fileTreeReducer,
    editor: editorReducer,
    propertiesPanel: propertiesPanelReducer,
    toolbar: toolbarReducer,
    bundleList: bundlesListReducer,
    coverPage: CoverPageReducer,
    dashboard: dashboardReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      coverPageApi.middleware,
      fileTreeApi.middleware,
      editorApi.middleware,
      dashboardApi.middleware
    ),
});

export default store;
// Export these types from the store file
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
