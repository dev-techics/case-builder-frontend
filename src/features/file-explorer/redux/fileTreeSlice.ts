import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FileNode } from '../types/types';
import { fileExplorerApi } from '../api/api';

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
}

interface FileTreeState {
  tree: Tree;
  expandedFolders: string[];
  isCreatingNewFolder: boolean;
  selectedFile: string | null;
  fileSelectionVersion: number;
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

interface NodeLocation {
  parentId: string | null;
  siblings: Children[];
  index: number;
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
  fileSelectionVersion: 0,
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

const findNodeLocation = (
  children: Children[],
  id: string,
  parentId: string | null
): NodeLocation | null => {
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (child.id === id) {
      return { parentId, siblings: children, index };
    }
    if (child.type === 'folder' && child.children) {
      const found = findNodeLocation(child.children, id, child.id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const insertUploadedFiles = (state: FileTreeState, files: FileNode[]) => {
  if (files.length === 0) {
    return;
  }

  const uploadParentId = files[0]?.parentId ?? null;

  if (state.selectedFile) {
    const selectedLocation = findNodeLocation(
      state.tree.children,
      state.selectedFile,
      null
    );

    if (selectedLocation && selectedLocation.parentId === uploadParentId) {
      selectedLocation.siblings.splice(selectedLocation.index + 1, 0, ...files);
      return;
    }
  }

  if (!uploadParentId) {
    state.tree.children = [...state.tree.children, ...files];
    return;
  }

  const addToParent = (children: Children[]): boolean => {
    for (const child of children) {
      if (child.id === uploadParentId && child.type === 'folder') {
        child.children = [...(child.children || []), ...files];
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

  if (!addToParent(state.tree.children)) {
    state.tree.children = [...state.tree.children, ...files];
  }
};

const insertCreatedFolder = (state: FileTreeState, folder: Children) => {
  const folderParentId = folder.parentId ?? null;
  const selectedTargetId = state.selectedFile ?? state.selectedFolderId;

  if (selectedTargetId) {
    const selectedLocation = findNodeLocation(
      state.tree.children,
      selectedTargetId,
      null
    );

    if (selectedLocation && selectedLocation.parentId === folderParentId) {
      selectedLocation.siblings.splice(selectedLocation.index + 1, 0, folder);
      return;
    }
  }

  if (!folderParentId) {
    state.tree.children = [...state.tree.children, folder];
    return;
  }

  const addToParent = (children: Children[]): boolean => {
    for (const child of children) {
      if (child.id === folderParentId && child.type === 'folder') {
        child.children = [...(child.children || []), folder];
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

  if (!addToParent(state.tree.children)) {
    state.tree.children = [...state.tree.children, folder];
  }
};

const getErrorMessage = (
  action: { payload?: unknown; error?: { message?: string } },
  fallback: string
): string => {
  if (action.payload && typeof action.payload === 'object') {
    const maybeMessage = (action.payload as { message?: string }).message;
    if (maybeMessage) {
      return maybeMessage;
    }
  }
  return action.error?.message || fallback;
};

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
      state.fileSelectionVersion += 1;
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
      insertUploadedFiles(state, action.payload);
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
    builder
      .addMatcher(fileExplorerApi.endpoints.getFileTree.matchPending, state => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(
        fileExplorerApi.endpoints.getFileTree.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.tree = action.payload;
          if (!state.expandedFolders.includes(action.payload.id)) {
            state.expandedFolders = [
              action.payload.id,
              ...state.expandedFolders,
            ];
          }
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.getFileTree.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = getErrorMessage(action, 'Failed to load tree');
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.deleteDocument.matchPending,
        (state, action) => {
          const { documentId } = action.meta.arg.originalArgs;
          state.operationsInProgress.deleting.push(documentId);
          state.error = null;
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.deleteDocument.matchFulfilled,
        (state, action) => {
          const { documentId } = action.meta.arg.originalArgs;

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
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.deleteDocument.matchRejected,
        (state, action) => {
          const { documentId } = action.meta.arg.originalArgs;
          state.error = getErrorMessage(action, 'Failed to delete document');

          // Remove from operations
          state.operationsInProgress.deleting =
            state.operationsInProgress.deleting.filter(id => id !== documentId);
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.renameDocument.matchPending,
        (state, action) => {
          const { documentId } = action.meta.arg.originalArgs;
          state.operationsInProgress.renaming.push(documentId);
          state.error = null;
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.renameDocument.matchFulfilled,
        (state, action) => {
          const { documentId, newName } = action.meta.arg.originalArgs;

          // Update in tree
          const file = state.tree.children.find(f => f.id === documentId);
          if (file) {
            file.name = newName;
          } else {
            findAndUpdateNode(state.tree.children, documentId, node => {
              node.name = newName;
            });
          }

          // Remove from operations
          state.operationsInProgress.renaming =
            state.operationsInProgress.renaming.filter(id => id !== documentId);
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.renameDocument.matchRejected,
        (state, action) => {
          const { documentId } = action.meta.arg.originalArgs;
          state.error = getErrorMessage(action, 'Failed to rename document');

          // Remove from operations
          state.operationsInProgress.renaming =
            state.operationsInProgress.renaming.filter(id => id !== documentId);
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.createFolder.matchFulfilled,
        (state, action) => {
          insertCreatedFolder(state, action.payload);
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.createFolder.matchRejected,
        (state, action) => {
          state.error = getErrorMessage(action, 'Failed to create folder');
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.reorderDocuments.matchPending,
        state => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.reorderDocuments.matchFulfilled,
        (state, action) => {
          state.loading = false;
          if (action.payload?.tree) {
            state.tree = action.payload.tree;
          }
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.reorderDocuments.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = getErrorMessage(action, 'Failed to reorder documents');
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.moveDocument.matchPending,
        state => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.moveDocument.matchFulfilled,
        (state, action) => {
          state.loading = false;
          if (action.payload?.tree) {
            state.tree = action.payload.tree;
          }
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.moveDocument.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = getErrorMessage(action, 'Failed to move document');
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.moveDocumentsBatch.matchPending,
        state => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.moveDocumentsBatch.matchFulfilled,
        (state, action) => {
          state.loading = false;
          if (!action.payload?.skipApplyTree && action.payload?.tree) {
            state.tree = action.payload.tree;
          }
        }
      )
      .addMatcher(
        fileExplorerApi.endpoints.moveDocumentsBatch.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = getErrorMessage(action, 'Failed to move documents');
        }
      );
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
