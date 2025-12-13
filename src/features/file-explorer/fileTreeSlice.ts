import { arrayMove } from '@dnd-kit/sortable';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import fileTreeData from '../../data/project-folder-data.json' with { type: 'json' };
import type { FileNode, FileTreeState, FolderNode } from './types';

// Redux slice
const fileTreeSlice = createSlice({
  name: 'fileTree',
  initialState: {
    tree: fileTreeData,
    expandedFolders: ['proj-1'],
    selectedFile: null,
    scrollToFileId: null,
  } as FileTreeState,
  reducers: {
    toggleFolder: (state, action: PayloadAction<string>) => {
      const folderId = action.payload;
      if (state.expandedFolders.includes(folderId)) {
        state.expandedFolders = state.expandedFolders.filter(
          id => id !== folderId
        );
      } else {
        state.expandedFolders.push(folderId);
      }
    },
    selectFile: (state, action: PayloadAction<string>) => {
      state.selectedFile = action.payload;
    },
    setScrollToFile: (state, action: PayloadAction<string | null>) => {
      state.scrollToFileId = action.payload;
    },
    addFiles: (state, action: PayloadAction<FileNode[]>) => {
      state.tree.children = [...state.tree.children, ...action.payload];
    },
    removeFile: (state, action: PayloadAction<string>) => {
      state.tree.children = state.tree.children.filter(
        f => f.id !== action.payload
      );
      if (state.selectedFile === action.payload) {
        state.selectedFile = null;
      }
    },
    reorderFiles: (
      state,
      action: PayloadAction<{ oldIndex: number; newIndex: number }>
    ) => {
      const { oldIndex, newIndex } = action.payload;
      state.tree.children = arrayMove(state.tree.children, oldIndex, newIndex);
    },
    setTree: (state, action: PayloadAction<FolderNode>) => {
      state.tree = action.payload;
    },
  },
});

export const {
  toggleFolder,
  selectFile,
  setScrollToFile,
  addFiles,
  removeFile,
  reorderFiles,
  setTree,
} = fileTreeSlice.actions;
export default fileTreeSlice.reducer;
