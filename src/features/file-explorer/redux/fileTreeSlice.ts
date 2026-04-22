import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fileTreeApi } from '../api';
import type {
  FileTree,
  FileTreeNodeId,
  ServerFileTreeNode,
} from '../types/fileTree';
import {
  dedupeOrdered,
  insertNodeIntoTree,
  isDescendant,
  mergeFileTree,
  normalizeServerNode,
  normalizeTreeParentId,
  removeNodeAndDescendantsFromTree,
} from './fileTreeModel';

export type Tree = FileTree;
export type Children = FileTree['nodes'][FileTreeNodeId];

interface FileTreeState {
  tree: FileTree;
  expanded: Record<string, boolean>;
  isCreatingNewFolder: boolean;
  selectedFile: string | null;
  selectedFileIds: string[];
  selectionAnchorId: string | null;
  fileSelectionVersion: number;
  selectedFolderId: string | null;
  scrollToFileId: string | null;
  loading: boolean;
  error: string | null;
  operationsInProgress: {
    deleting: string[];
    renaming: string[];
    rotating: string[];
    merging: boolean;
    uploading: boolean;
  };
}

const initialTree: FileTree = {
  id: 'bundle-loading',
  name: 'Bundle',
  projectName: 'Bundle',
  type: 'folder',
  nodes: {},
  children: {},
  rootIds: [],
};

const initialState: FileTreeState = {
  tree: initialTree,
  expanded: { [initialTree.id]: true },
  isCreatingNewFolder: false,
  selectedFile: null,
  selectedFileIds: [],
  selectionAnchorId: null,
  fileSelectionVersion: 0,
  selectedFolderId: null,
  scrollToFileId: null,
  loading: false,
  error: null,
  operationsInProgress: {
    deleting: [],
    renaming: [],
    rotating: [],
    merging: false,
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isSelectableFileNode = (state: FileTreeState, nodeId: string) =>
  state.tree.nodes[nodeId]?.type === 'file';

const pruneMultiFileSelection = (state: FileTreeState) => {
  state.selectedFileIds = state.selectedFileIds.filter(nodeId =>
    isSelectableFileNode(state, nodeId)
  );

  if (
    state.selectionAnchorId &&
    !isSelectableFileNode(state, state.selectionAnchorId)
  ) {
    state.selectionAnchorId = null;
  }
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
      state.expanded[folderId] = !state.expanded[folderId];
    },
    // New reducer to set folder creation state
    setIsCreatingNewFolder: (state, action: PayloadAction<boolean>) => {
      state.isCreatingNewFolder = action.payload;
    },

    setFileSelection: (
      state,
      action: PayloadAction<{
        selectedFileIds: string[];
        selectionAnchorId?: string | null;
        selectedFileId?: string | null;
      }>
    ) => {
      const nextSelectedFileIds = dedupeOrdered(
        action.payload.selectedFileIds.map(String)
      ).filter(nodeId => isSelectableFileNode(state, nodeId));

      state.selectedFileIds = nextSelectedFileIds;
      state.selectionAnchorId =
        action.payload.selectionAnchorId !== undefined
          ? action.payload.selectionAnchorId
          : state.selectionAnchorId;

      if (
        state.selectionAnchorId &&
        !isSelectableFileNode(state, state.selectionAnchorId)
      ) {
        state.selectionAnchorId = null;
      }

      if (action.payload.selectedFileId !== undefined) {
        state.selectedFile = action.payload.selectedFileId;
        state.fileSelectionVersion += 1;
        if (action.payload.selectedFileId) {
          state.selectedFolderId = null;
        }
      }
    },

    clearMultiFileSelection: state => {
      state.selectedFileIds = [];
      state.selectionAnchorId = null;
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
      state.tree = mergeFileTree(state.tree, action.payload);
      state.expanded[state.tree.id] ??= true;
    },

    reorderChildren: (
      state,
      action: PayloadAction<{
        parentId: FileTreeNodeId | null;
        orderedIds: string[];
      }>
    ) => {
      const { parentId, orderedIds } = action.payload;

      const existing =
        parentId === null
          ? state.tree.rootIds
          : (state.tree.children[parentId] ?? []);
      const existingSet = new Set(existing);

      const nextOrder = dedupeOrdered(orderedIds.map(String)).filter(id =>
        existingSet.has(id)
      );
      const missing = existing.filter(id => !nextOrder.includes(id));
      const next = [...nextOrder, ...missing];

      if (parentId === null) {
        state.tree.rootIds = next;
        return;
      }

      if (next.length === 0) {
        delete state.tree.children[parentId];
        return;
      }

      state.tree.children[parentId] = next;
    },

    moveNodes: (
      state,
      action: PayloadAction<{
        nodeIds: string[];
        newParentId: FileTreeNodeId | null;
        index?: number;
      }>
    ) => {
      const { nodeIds, newParentId, index } = action.payload;

      const orderedUniqueIds = dedupeOrdered(nodeIds.map(String)).filter(
        id => id in state.tree.nodes
      );
      if (orderedUniqueIds.length === 0) {
        return;
      }

      const movedSet = new Set(orderedUniqueIds);

      const destinationParentId =
        newParentId && state.tree.nodes[newParentId]?.type === 'folder'
          ? newParentId
          : null;

      if (destinationParentId) {
        for (const id of orderedUniqueIds) {
          const node = state.tree.nodes[id];
          if (
            node?.type === 'folder' &&
            isDescendant(state.tree, id, destinationParentId)
          ) {
            return;
          }
        }
      }

      const removeFromRoot = new Set<string>();
      const removeByParent = new Map<string, Set<string>>();

      for (const id of orderedUniqueIds) {
        const node = state.tree.nodes[id];
        if (!node) continue;

        const oldParentId = node.parentId;
        if (oldParentId === null) {
          removeFromRoot.add(id);
        } else {
          const set = removeByParent.get(oldParentId) ?? new Set<string>();
          set.add(id);
          removeByParent.set(oldParentId, set);
        }
      }

      if (removeFromRoot.size > 0) {
        state.tree.rootIds = state.tree.rootIds.filter(
          id => !removeFromRoot.has(id)
        );
      }

      for (const [parentId, idsToRemove] of removeByParent) {
        const list = state.tree.children[parentId];
        if (!list) continue;
        const next = list.filter(id => !idsToRemove.has(id));
        if (next.length === 0) {
          delete state.tree.children[parentId];
        } else {
          state.tree.children[parentId] = next;
        }
      }

      for (const id of orderedUniqueIds) {
        const node = state.tree.nodes[id];
        if (node) {
          node.parentId = destinationParentId;
        }
      }

      const destinationList =
        destinationParentId === null
          ? state.tree.rootIds
          : (state.tree.children[destinationParentId] ?? []);

      const filteredDestination = destinationList.filter(
        id => !movedSet.has(id)
      );
      const insertAt = clamp(
        typeof index === 'number' ? index : filteredDestination.length,
        0,
        filteredDestination.length
      );

      const nextDestination = [
        ...filteredDestination.slice(0, insertAt),
        ...orderedUniqueIds,
        ...filteredDestination.slice(insertAt),
      ];

      if (destinationParentId === null) {
        state.tree.rootIds = nextDestination;
        return;
      }

      if (nextDestination.length === 0) {
        delete state.tree.children[destinationParentId];
        return;
      }

      state.tree.children[destinationParentId] = nextDestination;
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
      .addMatcher(fileTreeApi.endpoints.getTree.matchPending, state => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(
        fileTreeApi.endpoints.getTree.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.error = null;
          const nextTree = action.payload;
          const isNewRoot = state.tree.id !== nextTree.id;
          state.tree = mergeFileTree(state.tree, nextTree);

          // Switching bundles should reset local UI state that is tied to a specific tree.
          if (isNewRoot) {
            state.expanded = { [nextTree.id]: true };
            state.selectedFile = null;
            state.selectedFileIds = [];
            state.selectionAnchorId = null;
            state.selectedFolderId = null;
            state.scrollToFileId = null;
          } else {
            state.expanded[nextTree.id] ??= true;
          }

          // Prune UI state that references nodes no longer in the tree.
          if (state.selectedFile && !(state.selectedFile in state.tree.nodes)) {
            state.selectedFile = null;
          }
          if (
            state.selectedFolderId &&
            !(state.selectedFolderId in state.tree.nodes)
          ) {
            state.selectedFolderId = null;
          }
          if (
            state.scrollToFileId &&
            !(state.scrollToFileId in state.tree.nodes)
          ) {
            state.scrollToFileId = null;
          }

          pruneMultiFileSelection(state);
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.getTree.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to load tree',
            action.error
          );
        }
      );

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

          const removedIds = removeNodeAndDescendantsFromTree(
            state.tree,
            documentId
          );

          for (const id of removedIds) {
            delete state.expanded[id];
          }

          // Clear selection if deleted (including descendants)
          if (state.selectedFile && removedIds.has(state.selectedFile)) {
            state.selectedFile = null;
          }
          if (
            state.selectedFolderId &&
            removedIds.has(state.selectedFolderId)
          ) {
            state.selectedFolderId = null;
          }
          if (state.scrollToFileId && removedIds.has(state.scrollToFileId)) {
            state.scrollToFileId = null;
          }

          state.selectedFileIds = state.selectedFileIds.filter(
            nodeId => !removedIds.has(nodeId)
          );
          if (
            state.selectionAnchorId &&
            removedIds.has(state.selectionAnchorId)
          ) {
            state.selectionAnchorId = null;
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
          const node = state.tree.nodes[documentId];
          if (node) node.name = newName;

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
      Merge Documents
    -------------------*/
    builder
      .addMatcher(fileTreeApi.endpoints.mergeDocuments.matchPending, state => {
        state.operationsInProgress.merging = true;
        state.error = null;
      })
      .addMatcher(
        fileTreeApi.endpoints.mergeDocuments.matchFulfilled,
        (state, action) => {
          state.operationsInProgress.merging = false;
          state.error = null;
          state.tree = mergeFileTree(state.tree, action.payload.tree);

          if (state.selectedFile && !(state.selectedFile in state.tree.nodes)) {
            state.selectedFile = null;
          }
          if (
            state.selectedFolderId &&
            !(state.selectedFolderId in state.tree.nodes)
          ) {
            state.selectedFolderId = null;
          }
          if (
            state.scrollToFileId &&
            !(state.scrollToFileId in state.tree.nodes)
          ) {
            state.scrollToFileId = null;
          }

          pruneMultiFileSelection(state);
        }
      )
      .addMatcher(
        fileTreeApi.endpoints.mergeDocuments.matchRejected,
        (state, action) => {
          state.operationsInProgress.merging = false;
          state.error = resolveErrorMessage(
            action.payload,
            'Failed to merge documents',
            action.error
          );
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
          const requestedParentEntry =
            action.meta.arg.originalArgs.formData.get('parent_id');
          const requestedParentIdRaw =
            typeof requestedParentEntry === 'string'
              ? requestedParentEntry
              : null;
          let requestedParentId = normalizeTreeParentId(
            requestedParentIdRaw,
            state.tree.id
          );

          // Uploading to a missing/invalid parent should fall back to root.
          if (
            requestedParentId &&
            state.tree.nodes[requestedParentId]?.type !== 'folder'
          ) {
            requestedParentId = null;
          }

          if (
            payload &&
            typeof payload === 'object' &&
            'documents' in payload &&
            Array.isArray((payload as { documents?: unknown }).documents)
          ) {
            const documents = (
              payload as {
                documents: Array<{
                  id: string | number;
                  name: string;
                  type: string;
                  url: string;
                }>;
              }
            ).documents;

            const baseList =
              requestedParentId === null
                ? state.tree.rootIds
                : (state.tree.children[requestedParentId] ?? []);

            // Insert right after the currently selected file (when it belongs to the upload target folder).
            let insertIndex = baseList.length;
            if (state.selectedFile) {
              const selectedNode = state.tree.nodes[state.selectedFile];
              const selectedParentId = selectedNode?.parentId ?? null;
              if (
                selectedNode?.type === 'file' &&
                selectedParentId === requestedParentId
              ) {
                const selectedIndex = baseList.indexOf(selectedNode.id);
                if (selectedIndex !== -1) {
                  insertIndex = selectedIndex + 1;
                }
              }
            }

            const nextList = [...baseList];

            for (const doc of documents) {
              if (doc.type !== 'file') continue;
              const id = String(doc.id);
              if (state.tree.nodes[id]) {
                continue;
              }

              state.tree.nodes[id] = {
                id,
                parentId: requestedParentId,
                name: doc.name,
                type: 'file',
                url: doc.url,
              };

              const at = clamp(insertIndex, 0, nextList.length);
              nextList.splice(at, 0, id);
              insertIndex += 1;
            }

            if (requestedParentId === null) {
              state.tree.rootIds = nextList;
            } else {
              state.tree.children[requestedParentId] = nextList;
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
          const node = action.payload as ServerFileTreeNode | undefined;
          if (!node || node.type !== 'folder') {
            return;
          }
          insertNodeIntoTree(
            state.tree,
            normalizeServerNode(node, state.tree.id)
          );
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
          const nextTree = action.payload.tree;
          state.tree = mergeFileTree(state.tree, nextTree);
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
          if (!action.payload.tree) return;
          const nextTree = action.payload.tree;
          state.tree = mergeFileTree(state.tree, nextTree);
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
          if (action.payload.skipApplyTree || !action.payload.tree) {
            return;
          }
          const nextTree = action.payload.tree;
          state.tree = mergeFileTree(state.tree, nextTree);
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
  setFileSelection,
  clearMultiFileSelection,
  selectFile,
  selectFolder,
  setScrollToFile,
  setTree,
  reorderChildren,
  moveNodes,
  clearError,
} = fileTreeSlice.actions;

export default fileTreeSlice.reducer;
