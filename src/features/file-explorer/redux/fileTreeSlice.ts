import { arrayMove } from '@dnd-kit/sortable';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { FileNode } from '../types/types';
import axiosInstance from '@/api/axiosInstance';

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

interface FileTreeState {
  tree: Tree;
  expandedFolders: string[];
  selectedFile: string | null;
  scrollToFileId: string | null;
  loading: boolean;
  error: string | null;
  // Track operations in progress
  operationsInProgress: {
    deleting: string[];
    renaming: string[];
    uploading: boolean;
  };
}

const initialState: FileTreeState = {
  tree: {
    id: 'root',
    projectName: 'Project name',
    type: 'folder',
    children: [],
  },
  expandedFolders: [],
  selectedFile: null,
  scrollToFileId: null,
  loading: false,
  error: null,
  operationsInProgress: {
    deleting: [],
    renaming: [],
    uploading: false,
  },
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

// Helper function to find a node by ID
const findNodeById = (children: Children[], id: string): Children | null => {
  for (const child of children) {
    if (child.id === id) {
      return child;
    }
    if (child.type === 'folder' && child.children) {
      const found = findNodeById(child.children, id);
      if (found) return found;
    }
  }
  return null;
};

/*=============================================
=            Async Thunks                     =
=============================================*/

/**
 * Load tree from backend
 */
export const loadTreeFromBackend = createAsyncThunk<
  Tree,
  number,
  { rejectValue: string }
>('fileTree/loadTreeFromBackend', async (bundleId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      `/api/bundles/${bundleId}/documents`
    );
    return response.data as Tree;
  } catch (err: any) {
    console.error('Failed to load tree from backend:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to load tree';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Delete document
 */
export const deleteDocument = createAsyncThunk<
  string,
  { documentId: string },
  { rejectValue: string }
>('fileTree/deleteDocument', async ({ documentId }, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/documents/${documentId}`);
    return documentId;
  } catch (err: any) {
    console.error('Failed to delete document:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to delete document';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Rename document
 */
export const renameDocument = createAsyncThunk<
  { id: string; newName: string },
  { documentId: string; newName: string },
  { rejectValue: string }
>(
  'fileTree/renameDocument',
  async ({ documentId, newName }, { rejectWithValue }) => {
    try {
      await axiosInstance.patch(`/api/documents/${documentId}/rename`, {
        name: newName,
      });
      return { id: documentId, newName };
    } catch (err: any) {
      console.error('Failed to rename document:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to rename document';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Upload files
 */
export const uploadFiles = createAsyncThunk<
  FileNode[],
  { bundleId: string; files: File[]; parentId?: string | null },
  { rejectValue: string }
>(
  'fileTree/uploadFiles',
  async ({ bundleId, files, parentId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('files[]', file);
      });

      if (parentId) {
        formData.append('parent_id', parentId);
      }

      const response = await axiosInstance.post(
        `/api/bundles/${bundleId}/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.documents as FileNode[];
    } catch (err: any) {
      console.error('Failed to upload files:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to upload files';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Create folder
 */
export const createFolder = createAsyncThunk<
  Children,
  { bundleId: string; name: string; parentId?: string | null },
  { rejectValue: string }
>(
  'fileTree/createFolder',
  async ({ bundleId, name, parentId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/api/bundles/${bundleId}/documents`,
        {
          name,
          type: 'folder',
          parent_id: parentId,
        }
      );
      return response.data as Children;
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to create folder';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Reorder documents
 */
export const reorderDocuments = createAsyncThunk<
  void,
  { bundleId: string; items: Array<{ id: string; order: number }> },
  { rejectValue: string }
>(
  'fileTree/reorderDocuments',
  async ({ bundleId, items }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/api/bundles/${bundleId}/documents/reorder`, {
        items,
      });
    } catch (err: any) {
      console.error('Failed to reorder documents:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to reorder documents';
      return rejectWithValue(errorMessage);
    }
  }
);

/*=============================================
=            Redux Slice                      =
=============================================*/

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

    // Local-only actions (optimistic updates)
    addFiles: (state, action: PayloadAction<FileNode[]>) => {
      state.tree.children = [...state.tree.children, ...action.payload];
    },

    removeFile: (state, action: PayloadAction<string>) => {
      const rootIndex = state.tree.children.findIndex(
        f => f.id === action.payload
      );

      if (rootIndex !== -1) {
        state.tree.children.splice(rootIndex, 1);
      } else {
        findAndRemoveNode(state.tree.children, action.payload);
      }

      if (state.selectedFile === action.payload) {
        state.selectedFile = null;
      }
    },

    renameFile: (
      state,
      action: PayloadAction<{ id: string; newName: string }>
    ) => {
      const { id, newName } = action.payload;
      const file = state.tree.children.find(f => f.id === id);

      if (file) {
        file.name = newName;
      } else {
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

    clearError: state => {
      state.error = null;
    },
  },

  extraReducers: builder => {
    /*-------------------
      Load Tree
    -------------------*/
    builder
      .addCase(loadTreeFromBackend.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTreeFromBackend.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload;
        state.expandedFolders = [action.payload.id, ...state.expandedFolders];
      })
      .addCase(loadTreeFromBackend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load tree';
      });

    /*-------------------
      Delete Document
    -------------------*/
    builder
      .addCase(deleteDocument.pending, (state, action) => {
        const documentId = action.meta.arg.documentId;
        state.operationsInProgress.deleting.push(documentId);
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        const documentId = action.payload;

        // Remove from tree
        findAndRemoveNode(state.tree.children, documentId);

        // Clear selection if deleted
        if (state.selectedFile === documentId) {
          state.selectedFile = null;
        }

        // Remove from operations
        state.operationsInProgress.deleting =
          state.operationsInProgress.deleting.filter(id => id !== documentId);
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        const documentId = action.meta.arg.documentId;
        state.error = action.payload || 'Failed to delete document';

        // Remove from operations
        state.operationsInProgress.deleting =
          state.operationsInProgress.deleting.filter(id => id !== documentId);
      });

    /*-------------------
      Rename Document
    -------------------*/
    builder
      .addCase(renameDocument.pending, (state, action) => {
        const documentId = action.meta.arg.documentId;
        state.operationsInProgress.renaming.push(documentId);
        state.error = null;
      })
      .addCase(renameDocument.fulfilled, (state, action) => {
        const { id, newName } = action.payload;

        // Update in tree
        const file = state.tree.children.find(f => f.id === id);
        if (file) {
          file.name = newName;
        } else {
          findAndUpdateNode(state.tree.children, id, node => {
            node.name = newName;
          });
        }

        // Remove from operations
        state.operationsInProgress.renaming =
          state.operationsInProgress.renaming.filter(docId => docId !== id);
      })
      .addCase(renameDocument.rejected, (state, action) => {
        const documentId = action.meta.arg.documentId;
        state.error = action.payload || 'Failed to rename document';

        // Remove from operations
        state.operationsInProgress.renaming =
          state.operationsInProgress.renaming.filter(id => id !== documentId);
      });

    /*-------------------
      Upload Files
    -------------------*/
    builder
      .addCase(uploadFiles.pending, state => {
        state.operationsInProgress.uploading = true;
        state.error = null;
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        // Add uploaded files to tree
        state.tree.children = [...state.tree.children, ...action.payload];
        state.operationsInProgress.uploading = false;
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.error = action.payload || 'Failed to upload files';
        state.operationsInProgress.uploading = false;
      });

    /*-------------------
      Create Folder
    -------------------*/
    builder
      .addCase(createFolder.fulfilled, (state, action) => {
        // Add folder to tree
        state.tree.children = [...state.tree.children, action.payload];
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create folder';
      });

    /*-------------------
      Reorder Documents
    -------------------*/
    builder.addCase(reorderDocuments.rejected, (state, action) => {
      state.error = action.payload || 'Failed to reorder documents';
    });
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
  clearError,
} = fileTreeSlice.actions;

export default fileTreeSlice.reducer;

/*=============================================
=            Selectors                        =
=============================================*/

// Helper to find a file by ID in the tree
export const selectFileById = (
  state: { fileTree: FileTreeState },
  fileId: string
): Children | null => {
  return findNodeById(state.fileTree.tree.children, fileId);
};

// Check if a document is being deleted
export const selectIsDeleting = (
  state: { fileTree: FileTreeState },
  documentId: string
): boolean => {
  return state.fileTree.operationsInProgress.deleting.includes(documentId);
};

// Check if a document is being renamed
export const selectIsRenaming = (
  state: { fileTree: FileTreeState },
  documentId: string
): boolean => {
  return state.fileTree.operationsInProgress.renaming.includes(documentId);
};

// Check if files are being uploaded
export const selectIsUploading = (state: {
  fileTree: FileTreeState;
}): boolean => {
  return state.fileTree.operationsInProgress.uploading;
};
