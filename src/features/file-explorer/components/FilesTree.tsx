/**
 * File Tree Component
 *
 * Responsibilities:
 * Renders Header Action bar and the file tree with drag and drop context
 *
 * Author: Anik Dey
 */

import type React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { Tree, Children } from '../redux/fileTreeSlice';
import FileExplorerHeader from './FileExplorerHeader';
import FileItemWrapper from './FileItemWrapper';
import {
  closestCenter,
  DragOverlay,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GripVertical } from 'lucide-react';
import {
  selectFile,
  selectFolder,
  setTree,
} from '../redux/fileTreeSlice';
import { useParams } from 'react-router-dom';
import {
  useMoveDocumentsBatchMutation,
  useReorderDocumentsMutation,
} from '../api';

type FileTreeProps = {
  tree: Tree;
  level: number;
};

type DropPreview = { parentId: string | null; index: number };

const FilesTree: React.FC<FileTreeProps> = ({ tree, level }) => {
  const dispatch = useAppDispatch();
  const [reorderDocuments] = useReorderDocumentsMutation();
  const [moveDocumentsBatch] = useMoveDocumentsBatchMutation();
  const expandedFolders = useAppSelector(
    state => state.fileTree.expandedFolders
  );
  const isExpanded = expandedFolders.includes(tree.id);

  const { bundleId } = useParams<{ bundleId: string }>();
  const extractedBundleId = bundleId || tree.id.replace('bundle-', '');

  const nodeById = useMemo(() => {
    const map = new Map<string, Children>();
    for (const node of tree.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [tree.nodes]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);

  const setDropPreviewIfChanged = useCallback((next: DropPreview | null) => {
    setDropPreview(prev => {
      if (
        prev?.parentId === next?.parentId &&
        prev?.index === next?.index
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const setOverIdIfChanged = useCallback((next: string | null) => {
    setOverId(prev => (prev === next ? prev : next));
  }, []);

  // Get the item being dragged
  const activeItem = activeId ? findItemById(nodeById, activeId) : null;
  const activeDragCount =
    activeItem?.type === 'file' && draggedFileIds.length > 1
      ? draggedFileIds.length
      : 1;

  const visibleFileIds = useMemo(
    () => getVisibleFileIds(tree, nodeById, new Set(expandedFolders)),
    [tree, nodeById, expandedFolders]
  );

  useEffect(() => {
    const validIds = new Set(getAllFileIds(tree, nodeById));
    setSelectedFileIds(prev => prev.filter(id => validIds.has(id)));
    setSelectionAnchorId(prev => (prev && validIds.has(prev) ? prev : null));
  }, [tree, nodeById]);

  const handleFolderSelect = useCallback(
    (folderId: string) => {
      setSelectedFileIds([]);
      setSelectionAnchorId(null);
      dispatch(selectFolder(folderId));
    },
    [dispatch]
  );

  const handleFileSelect = useCallback(
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
          return prev.includes(fileId)
            ? prev.filter(id => id !== fileId)
            : [...prev, fileId];
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-++
  | Drag and Drop Handlers Start  |
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  const handleDragStart = (event: any) => {
    const nextActiveId = String(event.active.id);
    setActiveId(nextActiveId);

    const nextActiveItem = findItemById(nodeById, nextActiveId);
    setDropPreview(null);
    if (nextActiveItem?.type === 'file') {
      const selected = selectedFileIds.includes(nextActiveId)
        ? selectedFileIds
        : [nextActiveId];
      setDraggedFileIds(selected);
      if (!selectedFileIds.includes(nextActiveId)) {
        setSelectedFileIds([nextActiveId]);
        setSelectionAnchorId(nextActiveId);
      }
      return;
    }

    setDraggedFileIds([]);
  };

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over, active } = event;
    if (!over) {
      setOverIdIfChanged(null);
      setDropPreviewIfChanged(null);
      return;
    }

    const rawOverId = String(over.id);
    const activeItem = findItemById(nodeById, String(active.id));

    if (activeItem?.type === 'file' && !rawOverId.endsWith('::content')) {
      const overTarget = findItemById(nodeById, rawOverId);
      if (overTarget?.type === 'folder') {
        setOverIdIfChanged(`${overTarget.id}::content`);
        setDropPreviewIfChanged({
          parentId: overTarget.id,
          // Hovering folder row means "drop at top inside folder"
          index: 0,
        });
        return;
      }
    }

    setOverIdIfChanged(rawOverId);

    if (!activeItem) {
      setDropPreviewIfChanged(null);
      return;
    }

    const selectedDragIds =
      draggedFileIds.length > 0
        ? draggedFileIds
        : active?.id
          ? [String(active.id)]
          : [];
    const preview = getDropPreviewFromOver({
      tree,
      nodeById,
      overId: rawOverId,
      overRect: over.rect,
      pointerY: getPointerClientY(event),
      selectedDragIds,
      draggedType: activeItem.type,
    });
    setDropPreviewIfChanged(preview);
  }, [draggedFileIds, nodeById, setDropPreviewIfChanged, setOverIdIfChanged, tree]);

  const { setNodeRef: setRootDropRef, isOver: isRootOver } = useDroppable({
    id: 'ROOT',
    data: { type: 'root' },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('active- ', active, '|| over- ', over);
    const activeId = String(active.id);
    const selectedDragIds =
      draggedFileIds.length > 0 ? draggedFileIds : [activeId];

    setActiveId(null);
    setOverId(null);
    setDraggedFileIds([]);
    setDropPreview(null);

    if (!active.id) {
      return;
    }

    // Find the dragged item
    const draggedItem = findItemById(nodeById, activeId);

    if (!draggedItem) {
      console.error('Could not find dragged item');
      return;
    }

    // No drop target
    if (!over) {
      console.log('⚠️ No drop target');
      return;
    }

    console.log('🎯 Drag End:', {
      draggedItem: draggedItem.name,
      draggedType: draggedItem.type,
      overId: over.id,
    });

    if (!dropPreview) {
      return;
    }

    const destinationParentId = dropPreview.parentId;
    const destinationIndex = dropPreview.index;
    const draggedParentId = getNormalizedParentId(nodeById, draggedItem.id, tree.id);
    const draggedParentIds = selectedDragIds.map(id =>
      getNormalizedParentId(nodeById, id, tree.id)
    );
    const isSameParentForSelection = draggedParentIds.every(
      parentId => parentId === draggedParentId
    );
    const isSameParentDrop =
      isSameParentForSelection && draggedParentId === destinationParentId;

    if (
      draggedItem.type === 'folder' &&
      destinationParentId &&
      isDescendant(nodeById, draggedItem.id, destinationParentId)
    ) {
      console.log('⚠️ Cannot drop folder into itself or its descendants');
      return;
    }

    if (isSameParentDrop) {
      const siblingIds = getChildrenIds(tree, nodeById, destinationParentId);
      const reorderedIds = reorderIdsByDropPosition(
        siblingIds,
        selectedDragIds,
        destinationIndex
      );

      if (arraysEqual(siblingIds, reorderedIds)) {
        return;
      }

      const optimisticTree = replaceChildrenIdsAtParent(
        tree,
        destinationParentId,
        reorderedIds
      );
      dispatch(setTree(optimisticTree));

      try {
        const items = reorderedIds.map((id, index) => ({ id, order: index }));
        await reorderDocuments({ bundleId: extractedBundleId, items }).unwrap();
      } catch (error) {
        console.error('❌ Error reordering:', error);
      }

      return;
    }

    const optimisticTree = moveItemsToParentInTree(
      tree,
      nodeById,
      selectedDragIds,
      destinationParentId,
      destinationIndex
    );
    dispatch(setTree(optimisticTree));

    try {
      const moveResult = await moveDocumentsBatch({
        bundleId: extractedBundleId,
        documentIds: selectedDragIds,
        newParentId: destinationParentId,
        skipApplyTree: true,
      }).unwrap();

      const nextTree = moveResult.tree;
      const nextNodeById = new Map<string, Children>(
        nextTree.nodes.map(node => [node.id, node])
      );
      const siblingIds = getChildrenIds(nextTree, nextNodeById, destinationParentId);
      const reorderedIds = reorderIdsByDropPosition(
        siblingIds,
        selectedDragIds,
        destinationIndex
      );

      if (!arraysEqual(siblingIds, reorderedIds)) {
        const items = reorderedIds.map((id, index) => ({ id, order: index }));
        await reorderDocuments({ bundleId: extractedBundleId, items }).unwrap();
      }
    } catch (error) {
      console.error('❌ Error moving file(s):', error);
    }

    return;
  };

  return (
    <>
      {/* Header */}
      <FileExplorerHeader folder={tree} level={level} isExpanded={isExpanded} />

      <DndContext
        sensors={sensors}
        collisionDetection={args => {
          return (
            pointerWithin(args) ?? rectIntersection(args) ?? closestCenter(args)
          );
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {isExpanded && (
          <div
            ref={setRootDropRef}
            className={`min-h-[16px] ${isRootOver ? 'bg-blue-50' : ''}`}
          >
            <FileItemWrapper //root
              folder={tree}
              level={level}
              activeItem={activeItem}
              overId={overId}
              activeId={activeId}
              selectedFileIds={selectedFileIds}
              onFileSelect={handleFileSelect}
              onFolderSelect={handleFolderSelect}
              dropPreview={dropPreview}
            />
          </div>
        )}

        <DragOverlay>
          {activeId && activeItem ? (
            <div className="pointer-events-none flex items-center bg-white shadow-xl rounded px-3 py-2 opacity-90 truncate">
              <button
                className="mr-1 w-4 flex-shrink-0 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing"
                type="button"
              >
                <GripVertical className="h-4 w-4 text-gray-500" />
              </button>
              <span className="truncate text-gray-800 text-sm">
                {activeDragCount > 1
                  ? `${activeDragCount} files`
                  : activeItem.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const findItemById = (nodeById: Map<string, Children>, id: string) =>
  nodeById.get(id) ?? null;

const getNormalizedParentId = (
  nodeById: Map<string, Children>,
  nodeId: string,
  treeId: string
): string | null => {
  const raw = nodeById.get(nodeId)?.parent ?? null;
  if (
    raw === null ||
    raw === treeId ||
    raw === 'root' ||
    raw.startsWith('bundle-')
  ) {
    return null;
  }
  return raw;
};

const getChildrenIds = (
  tree: Tree,
  nodeById: Map<string, Children>,
  parentId: string | null
): string[] => {
  if (parentId === null) {
    return Array.isArray(tree.children) ? tree.children : [];
  }

  const parent = nodeById.get(parentId);
  if (!parent || parent.type !== 'folder' || !Array.isArray(parent.children)) {
    return [];
  }

  return parent.children;
};

const reorderIdsByDropPosition = (
  childrenIds: string[],
  draggedIds: string[],
  targetIndex: number
) => {
  if (draggedIds.length === 0) return childrenIds;

  const childrenSet = new Set(childrenIds);
  const draggedUnique: string[] = [];
  for (const id of draggedIds) {
    if (!childrenSet.has(id)) continue;
    if (draggedUnique.includes(id)) continue;
    draggedUnique.push(id);
  }

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

const cloneTree = (tree: Tree): Tree => ({
  ...tree,
  children: Array.isArray(tree.children) ? [...tree.children] : [],
  nodes: tree.nodes.map(node =>
    node.type === 'folder'
      ? { ...node, children: Array.isArray(node.children) ? [...node.children] : [] }
      : { ...node }
  ),
});

const replaceChildrenIdsAtParent = (
  tree: Tree,
  parentId: string | null,
  nextChildrenIds: string[]
): Tree => {
  const nextTree = cloneTree(tree);
  if (parentId === null) {
    nextTree.children = [...nextChildrenIds];
    return nextTree;
  }

  const parent = nextTree.nodes.find(node => node.id === parentId);
  if (parent && parent.type === 'folder') {
    parent.children = [...nextChildrenIds];
  }

  return nextTree;
};

const moveItemsToParentInTree = (
  tree: Tree,
  nodeById: Map<string, Children>,
  itemIds: string[],
  newParentId: string | null,
  targetIndex?: number
): Tree => {
  if (itemIds.length === 0) return tree;

  const nextTree = cloneTree(tree);
  const nextNodeById = new Map<string, Children>(
    nextTree.nodes.map(node => [node.id, node])
  );

  const uniqueIds: string[] = [];
  for (const id of itemIds) {
    if (!nextNodeById.has(id)) continue;
    if (uniqueIds.includes(id)) continue;
    uniqueIds.push(id);
  }

  if (uniqueIds.length === 0) return tree;

  // Remove from existing parents
  for (const id of uniqueIds) {
    const node = nextNodeById.get(id);
    if (!node) continue;

    const oldParentId = getNormalizedParentId(nodeById, id, tree.id);
    if (oldParentId === null) {
      nextTree.children = nextTree.children.filter(childId => childId !== id);
    } else {
      const parent = nextNodeById.get(oldParentId);
      if (parent?.type === 'folder' && Array.isArray(parent.children)) {
        parent.children = parent.children.filter(childId => childId !== id);
      }
    }

    node.parent = newParentId;
  }

  const destinationIds = getChildrenIds(nextTree, nextNodeById, newParentId).filter(
    id => !uniqueIds.includes(id)
  );
  const insertAt =
    typeof targetIndex === 'number'
      ? Math.max(0, Math.min(targetIndex, destinationIds.length))
      : destinationIds.length;
  const nextDestinationIds = [
    ...destinationIds.slice(0, insertAt),
    ...uniqueIds,
    ...destinationIds.slice(insertAt),
  ];

  if (newParentId === null) {
    nextTree.children = nextDestinationIds;
    return nextTree;
  }

  const destinationParent = nextTree.nodes.find(node => node.id === newParentId);
  if (destinationParent?.type === 'folder') {
    destinationParent.children = nextDestinationIds;
    return nextTree;
  }

  // Fallback: if destination is invalid, keep items at root.
  nextTree.children = [
    ...nextTree.children,
    ...uniqueIds.filter(id => !nextTree.children.includes(id)),
  ];
  for (const id of uniqueIds) {
    const node = nextNodeById.get(id);
    if (node) node.parent = null;
  }

  return nextTree;
};

const getAllFileIds = (tree: Tree, nodeById: Map<string, Children>): string[] => {
  const ids: string[] = [];
  const visited = new Set<string>();

  const walk = (childIds: string[]) => {
    for (const id of childIds) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = nodeById.get(id);
      if (!node) continue;

      if (node.type === 'file') {
        ids.push(node.id);
        continue;
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children);
      }
    }
  };

  walk(tree.children);
  return ids;
};

const getVisibleFileIds = (
  tree: Tree,
  nodeById: Map<string, Children>,
  expandedFolderIds: Set<string>
): string[] => {
  const ids: string[] = [];
  const visited = new Set<string>();

  const walk = (childIds: string[]) => {
    for (const id of childIds) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = nodeById.get(id);
      if (!node) continue;

      if (node.type === 'file') {
        ids.push(node.id);
        continue;
      }

      if (!expandedFolderIds.has(node.id)) {
        continue;
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children);
      }
    }
  };

  walk(tree.children);
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
  nodeById,
  overId,
  overRect,
  pointerY,
  selectedDragIds,
  draggedType,
}: {
  tree: Tree;
  nodeById: Map<string, Children>;
  overId: string;
  overRect: { top: number; height: number } | null;
  pointerY: number | null;
  selectedDragIds: string[];
  draggedType: 'file' | 'folder';
}): DropPreview | null {
  if (overId === 'ROOT') {
    const rootChildren = getChildrenIds(tree, nodeById, null);
    return {
      parentId: null,
      index: rootChildren.length,
    };
  }

  if (overId.endsWith('::content')) {
    const parentId = overId.replace('::content', '');
    return {
      parentId,
      // Hovering folder content target should default to top insertion preview.
      index: 0,
    };
  }

  const overItem = findItemById(nodeById, overId);
  if (!overItem) {
    return null;
  }

  if (overItem.type === 'folder') {
    if (draggedType === 'file') {
      const children = getChildrenIds(tree, nodeById, overItem.id);
      return {
        parentId: overItem.id,
        index: children.length,
      };
    }

    const parentId = getNormalizedParentId(nodeById, overItem.id, tree.id);
    const siblings = getChildrenIds(tree, nodeById, parentId);
    const targetIndex = siblings.findIndex(id => id === overItem.id);

    if (targetIndex === -1) {
      return null;
    }

    let index = targetIndex;
    if (
      pointerY !== null &&
      overRect &&
      pointerY > overRect.top + overRect.height / 2
    ) {
      index = targetIndex + 1;
    }

    return { parentId, index };
  }

  const parentId = getNormalizedParentId(nodeById, overItem.id, tree.id);
  const siblings = getChildrenIds(tree, nodeById, parentId);
  const targetIndex = siblings.findIndex(id => id === overItem.id);

  if (targetIndex === -1) {
    return null;
  }

  const draggedSet = new Set(selectedDragIds);
  const sameTarget = draggedSet.has(overItem.id);
  if (sameTarget) {
    return null;
  }

  let index = targetIndex;
  if (
    pointerY !== null &&
    overRect &&
    pointerY > overRect.top + overRect.height / 2
  ) {
    index = targetIndex + 1;
  }

  return { parentId, index };
}

const isDescendant = (
  nodeById: Map<string, Children>,
  ancestorId: string,
  targetId: string
): boolean => {
  if (ancestorId === targetId) return true;

  let current: string | null = targetId;
  while (current) {
    if (current === ancestorId) return true;
    const node = nodeById.get(current);
    if (!node) return false;
    const parent = node.parent ?? null;
    if (parent === null || parent === 'root' || parent.startsWith('bundle-')) {
      return false;
    }
    current = parent;
  }

  return false;
};

export default FilesTree;
