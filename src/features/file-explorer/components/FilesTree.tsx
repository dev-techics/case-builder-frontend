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
  moveDocumentsBatch,
  reorderDocuments,
  selectFile,
  selectFolder,
  setTree,
} from '../redux/fileTreeSlice';
import { useParams } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';

type FileTreeProps = {
  tree: Tree | Children;
  level: number;
};

type DropPreview = { parentId: string | null; index: number };

const FilesTree: React.FC<FileTreeProps> = ({ tree, level }) => {
  const dispatch = useAppDispatch();
  const expandedFolders = useAppSelector(
    state => state.fileTree.expandedFolders
  );
  const isExpanded = expandedFolders.includes(tree.id);

  const { bundleId } = useParams<{ bundleId: string }>();
  const extractedBundleId = bundleId || tree.id.replace('bundle-', '');

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
  const activeItem = activeId ? findItemById(tree, activeId) : null;
  const activeDragCount =
    activeItem?.type === 'file' && draggedFileIds.length > 1
      ? draggedFileIds.length
      : 1;

  const visibleFileIds = useMemo(
    () => getVisibleFileIds(tree, new Set(expandedFolders), true),
    [tree, expandedFolders]
  );

  useEffect(() => {
    const validIds = new Set(getAllFileIds(tree));
    setSelectedFileIds(prev => prev.filter(id => validIds.has(id)));
    setSelectionAnchorId(prev => (prev && validIds.has(prev) ? prev : null));
  }, [tree]);

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

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  | Drag and Drop Handlers Start  |
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  const handleDragStart = (event: any) => {
    const nextActiveId = String(event.active.id);
    setActiveId(nextActiveId);

    const nextActiveItem = findItemById(tree, nextActiveId);
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
    const activeItem = findItemById(tree, String(active.id));

    if (activeItem?.type === 'file' && !rawOverId.endsWith('::content')) {
      const overTarget = findItemById(tree, rawOverId);
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
      overId: rawOverId,
      overRect: over.rect,
      pointerY: getPointerClientY(event),
      selectedDragIds,
      draggedType: activeItem.type,
    });
    setDropPreviewIfChanged(preview);
  }, [draggedFileIds, setDropPreviewIfChanged, setOverIdIfChanged, tree]);

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
    const draggedItem = findItemById(tree, activeId);

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

    // Find target item
    if (dropPreview) {
      const destinationParentId = dropPreview.parentId;
      const destinationIndex = dropPreview.index;
      const draggedParentId = findParentId(tree, draggedItem.id, tree.id);
      const draggedParentIds = selectedDragIds.map(id =>
        findParentId(tree, id, tree.id)
      );
      const isSameParentForSelection = draggedParentIds.every(
        parentId => parentId === draggedParentId
      );
      const isSameParentDrop =
        isSameParentForSelection && draggedParentId === destinationParentId;

      if (
        draggedItem.type === 'folder' &&
        destinationParentId &&
        isDescendant(draggedItem, destinationParentId)
      ) {
        console.log('⚠️ Cannot drop folder into itself or its descendants');
        return;
      }

      if (isSameParentDrop) {
        const siblings = getChildrenForParent(tree, destinationParentId);
        const reordered = reorderChildrenByDropPosition(
          siblings,
          selectedDragIds,
          destinationIndex
        );
        const hasOrderChange = reordered.some(
          (item, index) => item.id !== siblings[index]?.id
        );

        if (!hasOrderChange) {
          return;
        }

        const optimisticTree = replaceTreeChildrenAtParent(
          tree,
          destinationParentId,
          reordered
        );
        if (optimisticTree !== tree) {
          dispatch(setTree(optimisticTree as Tree));
        }

        try {
          const items = reordered.map((child, index) => ({
            id: child.id,
            order: index,
          }));
          await dispatch(
            reorderDocuments({
              bundleId: extractedBundleId,
              items,
            })
          ).unwrap();
        } catch (error) {
          console.error('❌ Error reordering:', error);
        }

        return;
      }

      const optimisticTree = moveItemsToParentInTree(
        tree,
        selectedDragIds,
        destinationParentId,
        destinationIndex
      );
      if (optimisticTree !== tree) {
        dispatch(setTree(optimisticTree as Tree));
      }

      try {
        const moveResult = await dispatch(
          moveDocumentsBatch({
            bundleId: extractedBundleId,
            documentIds: selectedDragIds,
            newParentId: destinationParentId,
            skipApplyTree: true,
          })
        ).unwrap();

        const parentChildren = getChildrenForParent(
          moveResult.tree,
          destinationParentId
        );
        const reordered = reorderChildrenByDropPosition(
          parentChildren,
          selectedDragIds,
          destinationIndex
        );
        const hasOrderChange = reordered.some(
          (item, index) => item.id !== parentChildren[index]?.id
        );

        if (hasOrderChange) {
          const items = reordered.map((child, index) => ({
            id: child.id,
            order: index,
          }));
          await dispatch(
            reorderDocuments({
              bundleId: extractedBundleId,
              items,
            })
          ).unwrap();
        }
      } catch (error) {
        console.error('❌ Error moving file(s):', error);
      }

      return;
    }

    const targetItem = findItemById(tree, over.id as string);

    if (!targetItem) {
      console.error('❌ Could not find target item');
      return;
    }

      const draggedParentId = findParentId(tree, draggedItem.id, tree.id);
      const targetParentId = findParentId(tree, targetItem.id, tree.id);
      const draggedParentIds = selectedDragIds.map(id =>
        findParentId(tree, id, tree.id)
      );

    // NEW LOGIC: Check if we're trying to reorder at the same level
    const isSameParent = draggedParentId === targetParentId;
    const isSameParentForSelection = draggedParentIds.every(
      parentId => parentId === draggedParentId
    );

    const isEmptyTargetFolder =
      targetItem.type === 'folder' &&
      (!targetItem.children || targetItem.children.length === 0);

    const shouldMoveIntoFolder =
      targetItem.type === 'folder' &&
      draggedItem.type === 'file' &&
      !selectedDragIds.includes(targetItem.id);

    const shouldMoveEmptyFolderTarget =
      isEmptyTargetFolder && draggedItem.id !== targetItem.id;

    if (shouldMoveIntoFolder || shouldMoveEmptyFolderTarget) {
      if (
        draggedItem.type === 'folder' &&
        isDescendant(draggedItem, targetItem.id)
      ) {
        console.log('⚠️ Cannot drop folder into itself or its descendants');
        return;
      }

      const destinationFolderId = targetItem.id;

      const optimisticTree = moveItemsToParentInTree(
        tree,
        selectedDragIds,
        destinationFolderId
      );
      if (optimisticTree !== tree) {
        dispatch(setTree(optimisticTree as Tree));
      }

      try {
        await dispatch(
          moveDocumentsBatch({
            bundleId: extractedBundleId,
            documentIds: selectedDragIds,
            newParentId: destinationFolderId,
          })
        ).unwrap();
        console.log('✅ Moved into folder successfully');
      } catch (error) {
        console.error('❌ Error moving into folder:', error);
      }

      return;
    }

    // CASE 1: Same parent level - REORDER (both files and folders)
    if (
      isSameParent &&
      isSameParentForSelection &&
      draggedItem.id !== targetItem.id
    ) {
      const parentFolder = draggedParentId
        ? findItemById(tree, draggedParentId)
        : tree;

      if (!parentFolder?.children) {
        console.error('❌ Parent folder has no children');
        return;
      }

      const oldIndex = parentFolder.children.findIndex(child => child.id === activeId);
      const newIndex = parentFolder.children.findIndex(
        child => child.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) {
        console.error('❌ Could not find indices:', { oldIndex, newIndex });
        return;
      }

      if (oldIndex === newIndex) {
        console.log('⏭️ Same position, skipping');
        return;
      }

      const reorderedChildren =
        selectedDragIds.length > 1
          ? moveGroupBeforeTarget(parentFolder.children, selectedDragIds, targetItem.id)
          : arrayMove(parentFolder.children, oldIndex, newIndex);

      // Optimistically update local tree to prevent flicker
      const optimisticTree = replaceTreeChildrenAtParent(
        tree,
        draggedParentId,
        reorderedChildren
      );
      if (optimisticTree !== tree) {
        dispatch(setTree(optimisticTree as Tree));
      }

      const items = reorderedChildren.map((child, index) => ({
        id: child.id,
        order: index,
      }));

      // Send to backend
      try {
        await dispatch(
          reorderDocuments({
            bundleId: extractedBundleId,
            items,
          })
        ).unwrap();

        console.log('✅ Reorder saved successfully');
      } catch (error) {
        console.error('❌ Error reordering:', error);
      }

      return;
    }

    /*
     * CASE 2: Dropping onto a folder at a different level (move INTO folder)
     */

    if (targetItem.type === 'folder' && !isSameParent) {
      // Prevent dropping a folder into itself or its descendants
      if (
        draggedItem.type === 'folder' &&
        isDescendant(draggedItem, targetItem.id)
      ) {
        console.log('⚠️ Cannot drop folder into itself or its descendants');
        return;
      }

      console.log(
        `📁 Moving ${draggedItem.name} (${draggedItem.type}) INTO folder ${targetItem.name}`
      );

      const optimisticTree = moveItemsToParentInTree(
        tree,
        selectedDragIds,
        targetItem.id
      );
      if (optimisticTree !== tree) {
        dispatch(setTree(optimisticTree as Tree));
      }

      try {
        await dispatch(
          moveDocumentsBatch({
            bundleId: extractedBundleId,
            documentIds: selectedDragIds,
            newParentId: targetItem.id,
          })
        ).unwrap();
        console.log('✅ Moved into folder successfully');
      } catch (error) {
        console.error('❌ Error moving into folder:', error);
      }

      return;
    }

    // * CASE 3: Different parents - move to target's parent level
    if (!isSameParent) {
      console.log(
        `📂 Moving ${draggedItem.name} (${draggedItem.type}) to same level as ${targetItem.name}`
      );

      const optimisticTree = moveItemsToParentInTree(
        tree,
        selectedDragIds,
        targetParentId
      );
      if (optimisticTree !== tree) {
        dispatch(setTree(optimisticTree as Tree));
      }

      try {
        await dispatch(
          moveDocumentsBatch({
            bundleId: extractedBundleId,
            documentIds: selectedDragIds,
            newParentId: targetParentId,
          })
        ).unwrap();
        console.log('✅ Moved to target parent successfully');
      } catch (error) {
        console.error('❌ Error moving to target parent:', error);
      }

      return;
    }
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

function replaceTreeChildrenAtParent(
  node: Tree | Children,
  parentId: string | null,
  newChildren: Children[]
): Tree | Children {
  if (!node.children) {
    return node;
  }

  if (!parentId) {
    return { ...node, children: newChildren };
  }

  let changed = false;
  const nextChildren = node.children.map(child => {
    if (child.id === parentId && child.type === 'folder') {
      changed = true;
      return { ...child, children: newChildren };
    }

    if (child.type === 'folder' && child.children) {
      const updated = replaceTreeChildrenAtParent(
        child,
        parentId,
        newChildren
      ) as Children;
      if (updated !== child) {
        changed = true;
        return updated;
      }
    }

    return child;
  });

  return changed ? { ...node, children: nextChildren } : node;
}

function moveGroupBeforeTarget(
  children: Children[],
  draggedIds: string[],
  targetId: string
): Children[] {
  const draggedSet = new Set(draggedIds);
  if (draggedSet.has(targetId)) {
    return children;
  }

  const dragged = children.filter(child => draggedSet.has(child.id));
  const remaining = children.filter(child => !draggedSet.has(child.id));
  const targetIndex = remaining.findIndex(child => child.id === targetId);

  if (targetIndex === -1) {
    return children;
  }

  return [
    ...remaining.slice(0, targetIndex),
    ...dragged,
    ...remaining.slice(targetIndex),
  ];
}

function moveItemsToParentInTree(
  tree: Tree | Children,
  itemIds: string[],
  newParentId: string | null,
  targetIndex?: number
): Tree | Children {
  if (!tree.children || itemIds.length === 0) {
    return tree;
  }

  const idSet = new Set(itemIds);
  const movedItems = itemIds
    .map(id => findItemById(tree, id))
    .filter((item): item is Children => Boolean(item));

  if (movedItems.length === 0) {
    return tree;
  }

  const clonedTree = cloneTreeNode(tree);
  for (const id of idSet) {
    removeItemById(clonedTree.children || [], id);
  }

  if (!newParentId) {
    const rootChildren = clonedTree.children || [];
    const insertIndex =
      typeof targetIndex === 'number'
        ? Math.max(0, Math.min(targetIndex, rootChildren.length))
        : rootChildren.length;
    clonedTree.children = [
      ...rootChildren.slice(0, insertIndex),
      ...movedItems,
      ...rootChildren.slice(insertIndex),
    ];
    return clonedTree;
  }

  const inserted = insertItemsIntoParent(
    clonedTree,
    newParentId,
    movedItems,
    targetIndex
  );
  if (!inserted) {
    clonedTree.children = [...(clonedTree.children || []), ...movedItems];
  }

  return clonedTree;
}

function cloneTreeNode(node: Tree | Children): Tree | Children {
  return {
    ...node,
    children: node.children ? node.children.map(child => cloneTreeNode(child) as Children) : undefined,
  } as Tree | Children;
}

function removeItemById(children: Children[], id: string): boolean {
  const index = children.findIndex(child => child.id === id);
  if (index !== -1) {
    children.splice(index, 1);
    return true;
  }

  for (const child of children) {
    if (child.type === 'folder' && child.children) {
      if (removeItemById(child.children, id)) {
        return true;
      }
    }
  }

  return false;
}

function insertItemsIntoParent(
  tree: Tree | Children,
  parentId: string,
  items: Children[],
  targetIndex?: number
): boolean {
  if (!tree.children) {
    return false;
  }

  for (const child of tree.children) {
    if (child.id === parentId && child.type === 'folder') {
      const existing = child.children || [];
      const insertIndex =
        typeof targetIndex === 'number'
          ? Math.max(0, Math.min(targetIndex, existing.length))
          : existing.length;
      child.children = [
        ...existing.slice(0, insertIndex),
        ...items,
        ...existing.slice(insertIndex),
      ];
      return true;
    }

    if (child.type === 'folder' && child.children) {
      if (insertItemsIntoParent(child, parentId, items, targetIndex)) {
        return true;
      }
    }
  }

  return false;
}

function getChildrenForParent(
  tree: Tree | Children,
  parentId: string | null
): Children[] {
  if (!tree.children) {
    return [];
  }

  if (parentId === null) {
    return tree.children;
  }

  const parent = findItemById(tree, parentId);
  if (!parent || parent.type !== 'folder') {
    return [];
  }

  return parent.children || [];
}

function reorderChildrenByDropPosition(
  children: Children[],
  draggedIds: string[],
  targetIndex: number
): Children[] {
  if (draggedIds.length === 0) {
    return children;
  }

  const draggedSet = new Set(draggedIds);
  const dragged = children.filter(child => draggedSet.has(child.id));
  const remaining = children.filter(child => !draggedSet.has(child.id));
  const insertIndex = Math.max(0, Math.min(targetIndex, remaining.length));

  return [
    ...remaining.slice(0, insertIndex),
    ...dragged,
    ...remaining.slice(insertIndex),
  ];
}

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
  tree: Tree | Children;
  overId: string;
  overRect: { top: number; height: number } | null;
  pointerY: number | null;
  selectedDragIds: string[];
  draggedType: 'file' | 'folder';
}): DropPreview | null {
  if (overId === 'ROOT') {
    const rootChildren = getChildrenForParent(tree, null);
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

  const overItem = findItemById(tree, overId);
  if (!overItem) {
    return null;
  }

  if (overItem.type === 'folder') {
    if (draggedType === 'file') {
      const children = getChildrenForParent(tree, overItem.id);
      return {
        parentId: overItem.id,
        index: children.length,
      };
    }

    const parentId = findParentId(tree, overItem.id, tree.id);
    const siblings = getChildrenForParent(tree, parentId);
    const targetIndex = siblings.findIndex(child => child.id === overItem.id);

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

  const parentId = findParentId(tree, overItem.id, tree.id);
  const siblings = getChildrenForParent(tree, parentId);
  const targetIndex = siblings.findIndex(child => child.id === overItem.id);

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

function getAllFileIds(node: Tree | Children): string[] {
  if (!node.children) {
    return node.type === 'file' ? [node.id] : [];
  }

  const ids: string[] = [];
  for (const child of node.children) {
    if (child.type === 'file') {
      ids.push(child.id);
      continue;
    }
    ids.push(...getAllFileIds(child));
  }
  return ids;
}

function getVisibleFileIds(
  node: Tree | Children,
  expandedFolderIds: Set<string>,
  isRoot = false
): string[] {
  if (!node.children) {
    return node.type === 'file' ? [node.id] : [];
  }

  const ids: string[] = [];
  const shouldTraverseChildren = isRoot || expandedFolderIds.has(node.id);
  if (!shouldTraverseChildren) {
    return ids;
  }

  for (const child of node.children) {
    if (child.type === 'file') {
      ids.push(child.id);
      continue;
    }
    ids.push(...getVisibleFileIds(child, expandedFolderIds));
  }

  return ids;
}

// Helper function to find an item by ID in the tree
function findItemById(folder: Tree | Children, id: string): Children | null {
  if (folder.id === id) {
    return folder as Children;
  }

  if (!folder.children) {
    return null;
  }

  for (const child of folder.children) {
    if (child.id === id) {
      return child;
    }

    if (child.type === 'folder' && child.children) {
      const found = findItemById(child, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

// Helper function to find parent ID of an item
function findParentId(
  folder: Tree | Children,
  childId: string,
  rootId: string
): string | null {
  if (!folder.children) {
    return null;
  }

  // Check if child is direct descendant
  const isDirectChild = folder.children.some(child => child.id === childId);
  if (isDirectChild) {
    if (folder.id === rootId || folder.id === 'root') {
      return null;
    }
    return folder.id.startsWith('bundle-') ? null : folder.id;
  }

  // Recursively search in subfolders
  for (const child of folder.children) {
    if (child.type === 'folder' && child.children) {
      const parentId = findParentId(child, childId, rootId);
      if (parentId !== null) {
        return parentId;
      }
    }
  }

  return null;
}

// Helper function to check if target is a descendant of the dragged folder
function isDescendant(folder: Children, targetId: string): boolean {
  if (folder.id === targetId) {
    return true;
  }

  if (!folder.children) {
    return false;
  }

  for (const child of folder.children) {
    if (child.id === targetId) {
      return true;
    }

    if (child.type === 'folder' && child.children) {
      if (isDescendant(child, targetId)) {
        return true;
      }
    }
  }

  return false;
}

export default FilesTree;
