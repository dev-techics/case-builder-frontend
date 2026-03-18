import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fileTreeApi } from '../api';
import { mockTree } from '../data';

// Tree node
export interface FileTreeNode {
  id: string;
  parent: string | null;
  name: string;
  type: 'file' | 'folder';
  url?: string;
  children: string[] | null;
}

export type Children = FileTreeNode;

export interface Tree {
  id: string;
  name: string;
  projectName?: string;
  type: 'folder';
  // Ordered list of node ids that live at the root level
  children: string[];
  nodes: FileTreeNode[];
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
    rotating: string[];
    uploading: boolean;
  };
}

const initialState: FileTreeState = {
  tree: mockTree,
  expandedFolders: [mockTree.id],
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
    rotating: [],
    uploading: false,
  },
};

const resolveErrorMessage = (
  payload: unknown,
  fallback: string,
  error?: { message?: string }
) => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data;
    if (typeof data === 'string') {
      return data;
    }
    if (
      data &&
      typeof data === 'object' &&
      typeof (data as { message?: unknown }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }
    if (typeof (payload as { error?: unknown }).error === 'string') {
      return (payload as { error: string }).error;
    }
  }

  return error?.message || fallback;
};

const buildNodeById = (nodes: FileTreeNode[]) => {
  const map = new Map<string, FileTreeNode>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
};

const insertNode = (tree: Tree, node: FileTreeNode) => {
  const nodeById = buildNodeById(tree.nodes);
  if (nodeById.has(node.id)) {
    return;
  }

  tree.nodes.push(node);

  const targetParentId = node.parent ?? null;
  if (targetParentId === null) {
    if (!tree.children.includes(node.id)) {
      tree.children.push(node.id);
    }
    return;
  }

  const parent = nodeById.get(targetParentId);
  if (parent && parent.type === 'folder') {
    if (!Array.isArray(parent.children)) {
      parent.children = [];
    }
    parent.children.push(node.id);
    return;
  }

  // Fallback: if parent doesn't exist, keep it at root level.
  node.parent = null;
  if (!tree.children.includes(node.id)) {
    tree.children.push(node.id);
  }
};

const removeNodeAndDescendants = (tree: Tree, nodeId: string) => {
  const nodeById = buildNodeById(tree.nodes);
  const target = nodeById.get(nodeId);
  if (!target) {
    return;
  }

  const toRemove = new Set<string>();
  const collect = (id: string) => {
    if (toRemove.has(id)) return;
    toRemove.add(id);
    const node = nodeById.get(id);
    if (node?.type === 'folder' && Array.isArray(node.children)) {
      for (const childId of node.children) {
        collect(childId);
      }
    }
  };
  collect(nodeId);

  const parentId = target.parent ?? null;
  if (parentId === null) {
    tree.children = tree.children.filter(id => !toRemove.has(id));
  } else {
    const parent = nodeById.get(parentId);
    if (parent?.type === 'folder' && Array.isArray(parent.children)) {
      parent.children = parent.children.filter(id => !toRemove.has(id));
    }
  }

  for (const node of tree.nodes) {
    if (node.type === 'folder' && Array.isArray(node.children)) {
      node.children = node.children.filter(id => !toRemove.has(id));
    }
  }

  tree.nodes = tree.nodes.filter(node => !toRemove.has(node.id));
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

    setTree: (state, action: PayloadAction<Tree>) => {
      state.tree = action.payload;
      if (!state.expandedFolders.includes(action.payload.id)) {
        state.expandedFolders = [action.payload.id, ...state.expandedFolders];
      }
    },

    clearError: state => {
      state.error = null;
    },
  },

  extraReducers: builder => {
    /*-------------------
      Load Tree
    -------------------*/
    // builder
    //   .addMatcher(fileTreeApi.endpoints.getTree.matchPending, state => {
    //     state.loading = true;
    //     state.error = null;
    //   })
    //   .addMatcher(
    //     fileTreeApi.endpoints.getTree.matchFulfilled,
    //     (state, action) => {
    //       state.loading = false;
    //       state.tree = action.payload;
    //       state.expandedFolders = [action.payload.id, ...state.expandedFolders];
    //     }
    //   )
    //   .addMatcher(
    //     fileTreeApi.endpoints.getTree.matchRejected,
    //     (state, action) => {
    //       state.loading = false;
    //       state.error = resolveErrorMessage(
    //         action.payload,
    //         'Failed to load tree',
    //         action.error
    //       );
    //     }
    //   );

    /*-------------------
      Delete Document
    -------------------*/
    builder
      .addMatcher(
        fileTreeApi.endpoints.deleteDocument.matchPending,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.operationsInProgress.deleting.push(documentId);
          state.error = null;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.deleteDocument.matchFulfilled,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;

          removeNodeAndDescendants(state.tree, documentId);

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
        fileTreeApi.endpoints.deleteDocument.matchRejected,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to delete document',
            action.error
          );

          // Remove from operations
          state.operationsInProgress.deleting =
            state.operationsInProgress.deleting.filter(id => id !== documentId);
        }
      );

    /*-------------------
      Rename Document
    -------------------*/
    builder
      .addMatcher(
        fileTreeApi.endpoints.renameDocument.matchPending,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.operationsInProgress.renaming.push(documentId);
          state.error = null;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.renameDocument.matchFulfilled,
        (state, action) => {
          const { documentId, newName } = action.meta.arg.originalArgs;
          const node = state.tree.nodes.find(n => n.id === documentId);
          if (node) {
            node.name = newName;
          }

          state.operationsInProgress.renaming =
            state.operationsInProgress.renaming.filter(id => id !== documentId);
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.renameDocument.matchRejected,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to rename document',
            action.error
          );

          // Remove from operations
          state.operationsInProgress.renaming =
            state.operationsInProgress.renaming.filter(id => id !== documentId);
        }
      );

    /*-------------------
      Rotate Document
    -------------------*/
    builder
      .addMatcher(
        fileTreeApi.endpoints.rotateDocument.matchPending,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.operationsInProgress.rotating.push(documentId);
          state.error = null;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.rotateDocument.matchFulfilled,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.operationsInProgress.rotating =
            state.operationsInProgress.rotating.filter(id => id !== documentId);
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.rotateDocument.matchRejected,
        (state, action) => {
          const documentId = action.meta.arg.originalArgs.documentId;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to rotate document',
            action.error
          );
          state.operationsInProgress.rotating =
            state.operationsInProgress.rotating.filter(id => id !== documentId);
        }
      );

    /*-------------------
      Upload Files
    -------------------*/
    builder
      .addMatcher(fileTreeApi.endpoints.uploadFiles.matchPending, state => {
        state.operationsInProgress.uploading = true;
        state.error = null;
      })
      .addMatcher(
        fileTreeApi.endpoints.uploadFiles.matchFulfilled,
        (state, action) => {
          const payload = action.payload;
          if (
            payload &&
            typeof payload === 'object' &&
            'documents' in payload &&
            Array.isArray((payload as { documents?: unknown }).documents)
          ) {
            const documents = (payload as {
              documents: Array<{
                id: string;
                parentId: string | null;
                name: string;
                type: string;
                url: string;
              }>;
            }).documents;

            for (const doc of documents) {
              if (doc.type !== 'file') continue;
              insertNode(state.tree, {
                id: String(doc.id),
                parent: doc.parentId,
                name: doc.name,
                type: 'file',
                url: doc.url,
                children: null,
              });
            }
          }

          state.operationsInProgress.uploading = false;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.uploadFiles.matchRejected,
        (state, action) => {
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to upload files',
            action.error
          );
          state.operationsInProgress.uploading = false;
        }
      );

    /*-------------------
      Create Folder
    -------------------*/
    builder
      .addMatcher(
        fileTreeApi.endpoints.createFolder.matchFulfilled,
        (state, action) => {
          const node = action.payload;
          if (node?.type === 'folder') {
            insertNode(state.tree, node);
          }
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.createFolder.matchRejected,
        (state, action) => {
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to create folder',
            action.error
          );
        }
      );

    /*-------------------
      Reorder Documents
    -------------------*/
    builder
      .addMatcher(
        fileTreeApi.endpoints.reorderDocuments.matchPending,
        state => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.reorderDocuments.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.tree = action.payload.tree;
          state.error = null;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.reorderDocuments.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to reorder documents',
            action.error
          );
        }
      );

    /*-------------------
      Move Documents
    -------------------*/
    builder
      .addMatcher(fileTreeApi.endpoints.moveDocument.matchPending, state => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(
        fileTreeApi.endpoints.moveDocument.matchFulfilled,
        (state, action) => {
          state.loading = false;
          if (action.payload.tree) {
            state.tree = action.payload.tree;
          }
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.moveDocument.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to move document',
            action.error
          );
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.moveDocumentsBatch.matchPending,
        state => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.moveDocumentsBatch.matchFulfilled,
        (state, action) => {
          state.loading = false;
          if (!action.payload.skipApplyTree && action.payload.tree) {
            state.tree = action.payload.tree;
          }
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.moveDocumentsBatch.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to move documents',
            action.error
          );
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
  setTree,
  clearError,
} = fileTreeSlice.actions;

export default fileTreeSlice.reducer;

/*=============================================
=            Selectors                        =
=============================================*/
