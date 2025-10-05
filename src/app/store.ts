import { configureStore } from "@reduxjs/toolkit";
import fileTreeSlice from "../features/file-explorer/fileTreeSlice";

const store = configureStore({
  reducer: {
    fileTree: fileTreeSlice,
  },
});

export default store;
// Export these types from the store file
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
