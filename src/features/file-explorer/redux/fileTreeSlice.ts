import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { FileNode } from '../types/types';
import axiosInstance, { DocumentApiService } from '@/api/axiosInstance';

export interface Children {
  id: string;
  parentId: string | null;
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
  indexUrl?: string;
}

interface FileTreeState {
  tree: Tree;
  expandedFolders: string[];
  isCreatingNewFolder: boolean;
  selectedFile: string | null;
  selectedFolderId: string | null;
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
  isCreatingNewFolder: false,
  selectedFile: null,
  selectedFolderId: null,
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
  { bundleId: string; tree: Tree },
  { bundleId: string; items: Array<{ id: string; order: number }> },
  { rejectValue: string }
>(
  'fileTree/reorderDocuments',
  async ({ bundleId, items }, { rejectWithValue }) => {
    try {
      console.log('🔄 Reordering documents:', items);

      await axiosInstance.post(`/api/bundles/${bundleId}/documents/reorder`, {
        items,
      });

      // Reload tree after reordering
      const treeResponse = await DocumentApiService.fetchTree(bundleId);

      console.log('✅ Reorder successful, tree reloaded');

      return {
        bundleId,
        tree: treeResponse,
      };
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

/**
 * Move a document to a different parent folder (or root)
 */
export const moveDocument = createAsyncThunk(
  'fileTree/moveDocument',
  async (
    {
      bundleId,
      documentId,
      newParentId,
    }: {
      bundleId: string;
      documentId: string;
      newParentId: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      console.log('📦 Moving document:', {
        documentId,
        newParentId: newParentId || 'root',
      });

      // Move the document
      await DocumentApiService.moveDocument(documentId, newParentId);

      // Reload the entire tree to get correct structure and order
      const treeResponse = await DocumentApiService.fetchTree(bundleId);

      console.log('✅ Move successful, tree reloaded');

      return {
        success: true,
        tree: treeResponse,
      };
    } catch (error: any) {
      console.error('❌ Error moving document:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to move document'
      );
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
    // New reducer to set folder creation state
    setIsCreatingNewFolder: (state, action: PayloadAction<boolean>) => {
      state.isCreatingNewFolder = action.payload;
    },

    selectFile: (state, action: PayloadAction<string | null>) => {
      state.selectedFile = action.payload;
      if (action.payload) {
        state.selectedFolderId = null;
      }
    },

    selectFolder: (state, action: PayloadAction<string | null>) => {
      state.selectedFolderId = action.payload;
    },

    setScrollToFile: (state, action: PayloadAction<string | null>) => {
      state.scrollToFileId = action.payload;
    },

    // Local-only actions (optimistic updates)
    addFiles: (state, action: PayloadAction<FileNode[]>) => {
      const parentId = action.payload[0]?.parentId;

      // If no parentId, add to root
      if (!parentId) {
        state.tree.children = [...state.tree.children, ...action.payload];
        return;
      }

      // Find the parent folder recursively and add files there
      const addToParent = (children: Children[]): boolean => {
        for (const child of children) {
          if (child.id === parentId && child.type === 'folder') {
            child.children = [...(child.children || []), ...action.payload];
            return true;
          }
          if (child.type === 'folder' && child.children) {
            if (addToParent(child.children)) {
              return true;
            }
          }
        }
        return false;
      };

      // Try to add to parent, if not found add to root as fallback
      if (!addToParent(state.tree.children)) {
        console.warn(`Parent folder ${parentId} not found, adding to root`);
        state.tree.children = [...state.tree.children, ...action.payload];
      }
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
      if (state.selectedFolderId === action.payload) {
        state.selectedFolderId = null;
      }
    },
    // Rename file locally
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

    // reorderFiles: (
    //   action: PayloadAction<{ oldIndex: number; newIndex: number }>
    // ) => {
    //   const { oldIndex, newIndex } = action.payload;
    //   // state.tree.children = arrayMove(state.tree.children, oldIndex, newIndex);
    //   // This is just for optimistic UI update
    //   // The real order comes from the backend
    //   console.log('🔄 Optimistic reorder:', { oldIndex, newIndex });
    // },

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
        if (state.selectedFolderId === documentId) {
          state.selectedFolderId = null;
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
    builder
      // Reorder Documents
      .addCase(reorderDocuments.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderDocuments.fulfilled, (state, action) => {
        console.log('✅ reorderDocuments.fulfilled - updating tree');
        state.loading = false;
        state.tree = action.payload.tree;
        state.error = null;
      })
      .addCase(reorderDocuments.rejected, (state, action) => {
        console.error('❌ reorderDocuments.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
        // Reload tree to recover from failed reorder
      });

    /*-------------------
      Move Documents
    -------------------*/
    builder
      .addCase(moveDocument.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moveDocument.fulfilled, (state, action) => {
        state.loading = false;

        // Update the entire tree with fresh data from server
        if (action.payload.tree) {
          state.tree = action.payload.tree;
        }

        console.log('✅ Document moved successfully');
      })
      .addCase(moveDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('❌ Move failed:', action.payload);
      });
  },
});

export const {
  toggleFolder,
  setIsCreatingNewFolder,
  selectFile,
  selectFolder,
  setScrollToFile,
  addFiles,
  removeFile,
  renameFile,
  // reorderFiles,
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
