import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppDispatch } from '@/app/hooks';

import { useMoveDocumentsBatchMutation, useReorderDocumentsMutation } from '../api';
import { dedupeOrdered, isDescendant, normalizeServerTree } from '../redux/fileTreeModel';
import { moveNodes, reorderChildren, selectFile, selectFolder } from '../redux/fileTreeSlice';
import type { FileTree, FileTreeDropPreview, FileTreeNodeType } from '../types/fileTree';

export const ROOT_DROPPABLE_ID = 'ROOT';

type UseFileTreeInteractionsArgs = {
  tree: FileTree;
  expanded: Record<string, boolean>;
  rootExpanded: boolean;
  bundleId: string;
};

/**
 * Keeps `FilesTree` readable by moving selection + drag-and-drop state/handlers into a hook.
 *
 * Notes:
 * - Multi-select is for *files only* (folders are single-drag).
 * - `dropPreview` is computed on `onDragOver` and used on `onDragEnd`.
 */
export const useFileTreeInteractions = ({
  tree,
  expanded,
  rootExpanded,
  bundleId,
}: UseFileTreeInteractionsArgs) => {
  const dispatch = useAppDispatch();
  const [reorderDocuments] = useReorderDocumentsMutation();
  const [moveDocumentsBatch] = useMoveDocumentsBatchMutation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);

  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [dropPreview, setDropPreview] = useState<FileTreeDropPreview | null>(null);

  const activeItem = activeId ? tree.nodes[activeId] ?? null : null;
  const activeDragCount =
    activeItem?.type === 'file' && draggedFileIds.length > 1 ? draggedFileIds.length : 1;

  const visibleFileIds = useMemo(
    () => getVisibleFileIds(tree, rootExpanded, expanded),
    [tree, rootExpanded, expanded]
  );

  useEffect(() => {
    // Keep selection stable when the server updates the tree.
    const validIds = new Set(getAllFileIds(tree));
    setSelectedFileIds(prev => prev.filter(id => validIds.has(id)));
    setSelectionAnchorId(prev => (prev && validIds.has(prev) ? prev : null));
  }, [tree]);

  const onFolderSelect = useCallback(
    (folderId: string) => {
      setSelectedFileIds([]);
      setSelectionAnchorId(null);
      dispatch(selectFolder(folderId));
    },
    [dispatch]
  );

  const onFileSelect = useCallback(
    (
      fileId: string,
      modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
    ) => {
      const isRangeSelect = Boolean(modifiers?.shiftKey);
      const isToggleSelect = Boolean(modifiers?.ctrlKey || modifiers?.metaKey);

      setSelectedFileIds(prev => {
        if (isRangeSelect && selectionAnchorId) {
          const start = visibleFileIds.indexOf(selectionAnchorId);
          const end = visibleFileIds.indexOf(fileId);
          if (start !== -1 && end !== -1) {
            const [from, to] = start <= end ? [start, end] : [end, start];
            return visibleFileIds.slice(from, to + 1);
          }
        }

        if (isToggleSelect) {
          return prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId];
        }

        return [fileId];
      });

      if (!isRangeSelect) {
        setSelectionAnchorId(fileId);
      }
      dispatch(selectFile(fileId));
    },
    [dispatch, selectionAnchorId, visibleFileIds]
  );

  const setDropPreviewIfChanged = useCallback((next: FileTreeDropPreview | null) => {
    setDropPreview(prev => {
      if (prev?.parentId === next?.parentId && prev?.index === next?.index) {
        return prev;
      }
      return next;
    });
  }, []);

  const setOverIdIfChanged = useCallback((next: string | null) => {
    setOverId(prev => (prev === next ? prev : next));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const nextActiveId = String(event.active.id);
      setActiveId(nextActiveId);
      setDropPreview(null);

      const nextActiveItem = tree.nodes[nextActiveId];
      if (nextActiveItem?.type === 'file') {
        const selected = selectedFileIds.includes(nextActiveId)
          ? selectedFileIds
          : [nextActiveId];
        setDraggedFileIds(selected);

        // Dragging an unselected file should select it first.
        if (!selectedFileIds.includes(nextActiveId)) {
          setSelectedFileIds([nextActiveId]);
          setSelectionAnchorId(nextActiveId);
        }
        return;
      }

      setDraggedFileIds([]);
    },
    [selectedFileIds, tree]
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, active } = event;
      if (!over) {
        setOverIdIfChanged(null);
        setDropPreviewIfChanged(null);
        return;
      }

      const rawOverId = String(over.id);
      const currentActive = tree.nodes[String(active.id)];

      // UX: hovering a folder row previews dropping "inside" that folder.
      if (currentActive?.type === 'file' && !rawOverId.endsWith('::content')) {
        const overTarget = tree.nodes[rawOverId];
        if (overTarget?.type === 'folder') {
          setOverIdIfChanged(`${overTarget.id}::content`);
          setDropPreviewIfChanged({ parentId: overTarget.id, index: 0 });
          return;
        }
      }

      setOverIdIfChanged(rawOverId);

      if (!currentActive) {
        setDropPreviewIfChanged(null);
        return;
      }

      const selectedDragIds =
        draggedFileIds.length > 0 ? draggedFileIds : active?.id ? [String(active.id)] : [];
      const preview = getDropPreviewFromOver({
        tree,
        overId: rawOverId,
        overRect: over.rect,
        pointerY: getPointerClientY(event),
        selectedDragIds,
        draggedType: currentActive.type,
      });
      setDropPreviewIfChanged(preview);
    },
    [draggedFileIds, setDropPreviewIfChanged, setOverIdIfChanged, tree]
  );

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const nextActiveId = String(active.id);
      const selectedDragIds = draggedFileIds.length > 0 ? draggedFileIds : [nextActiveId];

      setActiveId(null);
      setOverId(null);
      setDraggedFileIds([]);
      setDropPreview(null);

      const draggedItem = tree.nodes[nextActiveId];
      if (!draggedItem || !over || !dropPreview) {
        return;
      }

      const destinationParentId = dropPreview.parentId;
      const destinationIndex = dropPreview.index;

      // Multi-select moves only support moving files that share the same parent.
      const draggedParentId = draggedItem.parentId ?? null;
      const draggedParentIds = selectedDragIds.map(id => tree.nodes[id]?.parentId ?? null);
      const isSameParentForSelection = draggedParentIds.every(parentId => parentId === draggedParentId);
      const isSameParentDrop = isSameParentForSelection && draggedParentId === destinationParentId;

      // Safety: don't allow a folder to be dropped into its own descendants.
      if (
        draggedItem.type === 'folder' &&
        destinationParentId &&
        isDescendant(tree, draggedItem.id, destinationParentId)
      ) {
        return;
      }

      if (isSameParentDrop) {
        const siblingIds = getChildrenIds(tree, destinationParentId);
        const reorderedIds = reorderIdsByDropPosition(siblingIds, selectedDragIds, destinationIndex);
        if (arraysEqual(siblingIds, reorderedIds)) {
          return;
        }

        dispatch(reorderChildren({ parentId: destinationParentId, orderedIds: reorderedIds }));

        try {
          const items = reorderedIds.map((id, order) => ({ id, order }));
          await reorderDocuments({ bundleId, items }).unwrap();
        } catch (error) {
          console.error('❌ Error reordering:', error);
        }

        return;
      }

      dispatch(
        moveNodes({
          nodeIds: selectedDragIds,
          newParentId: destinationParentId,
          index: destinationIndex,
        })
      );

      try {
        const moveResult = await moveDocumentsBatch({
          bundleId,
          documentIds: selectedDragIds,
          newParentId: destinationParentId,
          skipApplyTree: true,
        }).unwrap();

        const nextTree = normalizeServerTree(moveResult.tree);
        const siblingIds = getChildrenIds(nextTree, destinationParentId);
        const reorderedIds = reorderIdsByDropPosition(siblingIds, selectedDragIds, destinationIndex);

        if (!arraysEqual(siblingIds, reorderedIds)) {
          const items = reorderedIds.map((id, order) => ({ id, order }));
          await reorderDocuments({ bundleId, items }).unwrap();
        }
      } catch (error) {
        console.error('❌ Error moving file(s):', error);
      }
    },
    [bundleId, dispatch, draggedFileIds, dropPreview, moveDocumentsBatch, reorderDocuments, tree]
  );

  return {
    sensors,
    activeId,
    overId,
    activeItem,
    activeDragCount,
    selectedFileIds,
    dropPreview,
    onFolderSelect,
    onFileSelect,
    onDragStart,
    onDragOver,
    onDragEnd,
  };
};

const arraysEqual = (a: ReadonlyArray<string>, b: ReadonlyArray<string>) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const getChildrenIds = (tree: FileTree, parentId: string | null): string[] => {
  if (parentId === null) {
    return Array.isArray(tree.rootIds) ? tree.rootIds : [];
  }
  const list = tree.children[parentId];
  return Array.isArray(list) ? list : [];
};

const reorderIdsByDropPosition = (
  childrenIds: string[],
  draggedIds: string[],
  targetIndex: number
) => {
  if (draggedIds.length === 0) return childrenIds;

  const childrenSet = new Set(childrenIds);
  const draggedUnique = dedupeOrdered(draggedIds).filter(id => childrenSet.has(id));
  if (draggedUnique.length === 0) return childrenIds;

  const draggedSet = new Set(draggedUnique);
  const remaining = childrenIds.filter(id => !draggedSet.has(id));
  const insertIndex = Math.max(0, Math.min(targetIndex, remaining.length));

  return [
    ...remaining.slice(0, insertIndex),
    ...draggedUnique,
    ...remaining.slice(insertIndex),
  ];
};

const getAllFileIds = (tree: FileTree): string[] => {
  const ids: string[] = [];
  const visited = new Set<string>();

  const walk = (childIds: ReadonlyArray<string>) => {
    for (const id of childIds) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = tree.nodes[id];
      if (!node) continue;

      if (node.type === 'file') {
        ids.push(node.id);
        continue;
      }

      const nestedIds = getChildrenIds(tree, node.id);
      if (nestedIds.length > 0) {
        walk(nestedIds);
      }
    }
  };

  walk(getChildrenIds(tree, null));
  return ids;
};

const getVisibleFileIds = (
  tree: FileTree,
  rootExpanded: boolean,
  expanded: Record<string, boolean>
): string[] => {
  if (!rootExpanded) {
    return [];
  }

  const ids: string[] = [];
  const visited = new Set<string>();

  const walk = (childIds: ReadonlyArray<string>) => {
    for (const id of childIds) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = tree.nodes[id];
      if (!node) continue;

      if (node.type === 'file') {
        ids.push(node.id);
        continue;
      }

      if (!expanded[node.id]) {
        continue;
      }

      const nestedIds = getChildrenIds(tree, node.id);
      if (nestedIds.length > 0) {
        walk(nestedIds);
      }
    }
  };

  walk(getChildrenIds(tree, null));
  return ids;
};

function getPointerClientY(event: DragOverEvent): number | null {
  const activatorEvent = event.activatorEvent;
  if (!activatorEvent) {
    return null;
  }

  if ('clientY' in activatorEvent) {
    return activatorEvent.clientY as number;
  }

  if ('touches' in activatorEvent) {
    const touchEvent = activatorEvent as TouchEvent;
    if (touchEvent.touches.length > 0) {
      return touchEvent.touches[0].clientY;
    }
  }

  return null;
}

function getDropPreviewFromOver({
  tree,
  overId,
  overRect,
  pointerY,
  selectedDragIds,
  draggedType,
}: {
  tree: FileTree;
  overId: string;
  overRect: { top: number; height: number } | null;
  pointerY: number | null;
  selectedDragIds: string[];
  draggedType: FileTreeNodeType;
}): FileTreeDropPreview | null {
  if (overId === ROOT_DROPPABLE_ID) {
    const rootChildren = getChildrenIds(tree, null);
    return { parentId: null, index: rootChildren.length };
  }

  if (overId.endsWith('::content')) {
    const parentId = overId.replace('::content', '');
    return { parentId, index: 0 };
  }

  const overItem = tree.nodes[overId] ?? null;
  if (!overItem) {
    return null;
  }

  if (overItem.type === 'folder') {
    if (draggedType === 'file') {
      const children = getChildrenIds(tree, overItem.id);
      return { parentId: overItem.id, index: children.length };
    }

    const parentId = overItem.parentId ?? null;
    const siblings = getChildrenIds(tree, parentId);
    const targetIndex = siblings.findIndex(id => id === overItem.id);
    if (targetIndex === -1) {
      return null;
    }

    let index = targetIndex;
    if (pointerY !== null && overRect && pointerY > overRect.top + overRect.height / 2) {
      index = targetIndex + 1;
    }

    return { parentId, index };
  }

  const parentId = overItem.parentId ?? null;
  const siblings = getChildrenIds(tree, parentId);
  const targetIndex = siblings.findIndex(id => id === overItem.id);
  if (targetIndex === -1) {
    return null;
  }

  const draggedSet = new Set(selectedDragIds);
  if (draggedSet.has(overItem.id)) {
    return null;
  }

  let index = targetIndex;
  if (pointerY !== null && overRect && pointerY > overRect.top + overRect.height / 2) {
    index = targetIndex + 1;
  }

  return { parentId, index };
}

