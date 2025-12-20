import { arrayMove } from '@dnd-kit/sortable';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FileNode } from './types';

export interface Children {
  id: string;
  name: string;
  type: 'file' | 'folder';
  url?: string;
  children?: Children[];
}

export interface Tree {
  id: string;
  projectName: string;
  type: 'folder';
  children: Children[];
}

interface FileTreeeState {
  tree: Tree;
  expandedFolders: string[];
  selectedFile: string | null;
  scrollToFileId: string | null;
}

const mockData: Tree = {
  id: 'proj-1',
  projectName: 'Project Alpha',
  type: 'folder',
  children: [
    {
      id: 'file-1',
      name: 'Sample.pdf',
      type: 'file',
      url: '/sample.pdf',
    },
    {
      id: 'file-9',
      name: 'Design.pdf',
      type: 'file',
      url: '/file-sample_150kB.pdf',
    },
    {
      id: 'file-2',
      name: 'Specs.pdf',
      type: 'file',
      url: '/dummy-pdf_2.pdf',
    },
    {
      id: 'file-5',
      name: 'Report.pdf',
      type: 'file',
      url: '/pdf_3.pdf',
    },
    {
      id: 'file-901',
      name: 'importants',
      type: 'folder',
      children: [
        {
          id: 'file-98',
          name: 'test.pdf',
          type: 'file',
          url: '/test.pdf',
        },
      ],
    },
    {
      id: 'file-6',
      name: 'test.pdf',
      type: 'file',
      url: '/test.pdf',
    },
    {
      id: 'file-8',
      name: 'test-2.pdf',
      type: 'file',
      url: '/test-2.pdf',
    },
  ],
};

const initialState: FileTreeeState = {
  tree: mockData,
  expandedFolders: ['proj-1'],
  selectedFile: null,
  scrollToFileId: null,
};

// Helper function to find and update a node in the tree
const findAndUpdateNode = (
  children: Children[],
  id: string,
  updateFn: (node: Children) => void
): boolean => {
  for (const child of children) {
    if (child.id === id) {
      updateFn(child);
      return true;
    }
    if (child.type === 'folder' && child.children) {
      if (findAndUpdateNode(child.children, id, updateFn)) {
        return true;
      }
    }
  }
  return false;
};

// Helper function to find and remove a node from the tree
const findAndRemoveNode = (children: Children[], id: string): boolean => {
  const index = children.findIndex(child => child.id === id);
  if (index !== -1) {
    children.splice(index, 1);
    return true;
  }

  for (const child of children) {
    if (child.type === 'folder' && child.children) {
      if (findAndRemoveNode(child.children, id)) {
        return true;
      }
    }
  }
  return false;
};

// Redux slice
const fileTreeSlice = createSlice({
  name: 'fileTree',
  initialState,
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
      // Try to remove from root level first
      const rootIndex = state.tree.children.findIndex(
        f => f.id === action.payload
      );

      if (rootIndex !== -1) {
        state.tree.children.splice(rootIndex, 1);
      } else {
        // Search and remove from nested folders
        findAndRemoveNode(state.tree.children, action.payload);
      }

      // Clear selection if the deleted file was selected
      if (state.selectedFile === action.payload) {
        state.selectedFile = null;
      }
    },
    renameFile: (
      state,
      action: PayloadAction<{ id: string; newName: string }>
    ) => {
      const { id, newName } = action.payload;

      // Try to find in root level first
      const file = state.tree.children.find(f => f.id === id);
      if (file) {
        file.name = newName;
      } else {
        // Search in nested folders
        findAndUpdateNode(state.tree.children, id, node => {
          node.name = newName;
        });
      }
    },
    reorderFiles: (
      state,
      action: PayloadAction<{ oldIndex: number; newIndex: number }>
    ) => {
      const { oldIndex, newIndex } = action.payload;
      state.tree.children = arrayMove(state.tree.children, oldIndex, newIndex);
    },
    setTree: (state, action: PayloadAction<Tree>) => {
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
  renameFile,
  reorderFiles,
  setTree,
} = fileTreeSlice.actions;
export default fileTreeSlice.reducer;
