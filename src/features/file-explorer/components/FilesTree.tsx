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
import { useState } from 'react';
import { moveDocument, reorderDocuments } from '../redux/fileTreeSlice';
import { useParams } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';

type FileTreeProps = {
  tree: Tree | Children;
  level: number;
};

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

  // Get the item being dragged
  const activeItem = activeId ? findItemById(tree, activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 🔥 ROOT DROPPABLE (only once)
  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({
    id: 'ROOT',
    data: {
      type: 'root',
      parentId: null,
    },
  });

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  | Drag and Drop Handlers Start  |
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId((over?.id as string) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('active- ', active, '|| over- ', over);
    setActiveId(null);
    setOverId(null);

    if (!active.id) {
      return;
    }

    // Find the dragged item
    const draggedItem = findItemById(tree, active.id as string);

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

    // CASE: Dropping into ROOT
    if (over.id === 'ROOT') {
      const draggedParentId = findParentId(tree, draggedItem.id);

      // Already in root, no action needed
      if (!draggedParentId) {
        console.log('⏭️ Already in root, skipping');
        return;
      }

      console.log(
        `📤 Moving ${draggedItem.name} (${draggedItem.type}) to ROOT`
      );

      try {
        await dispatch(
          moveDocument({
            bundleId: extractedBundleId,
            documentId: draggedItem.id,
            newParentId: null,
          })
        ).unwrap();
        console.log('✅ Moved to root successfully');
      } catch (error) {
        console.error('❌ Error moving to root:', error);
      }

      return;
    }

    // Find target item
    const targetItem = findItemById(tree, over.id as string);

    if (!targetItem) {
      console.error('❌ Could not find target item');
      return;
    }

    const draggedParentId = findParentId(tree, draggedItem.id);
    const targetParentId = findParentId(tree, targetItem.id);

    // NEW LOGIC: Check if we're trying to reorder at the same level
    const isSameParent = draggedParentId === targetParentId;

    // CASE 1: Same parent level - REORDER (both files and folders)
    if (isSameParent && draggedItem.id !== targetItem.id) {
      const parentFolder = draggedParentId
        ? findItemById(tree, draggedParentId)
        : tree;

      if (!parentFolder?.children) {
        console.error('❌ Parent folder has no children');
        return;
      }

      const oldIndex = parentFolder.children.findIndex(
        child => child.id === active.id
      );
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

      console.log(
        `🔄 Reordering ${draggedItem.name} (${draggedItem.type}) from ${oldIndex} to ${newIndex}`
      );

      // Calculate new order
      const reorderedChildren = arrayMove(
        parentFolder.children,
        oldIndex,
        newIndex
      );

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

      try {
        await dispatch(
          moveDocument({
            bundleId: extractedBundleId,
            documentId: draggedItem.id,
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

      try {
        await dispatch(
          moveDocument({
            bundleId: extractedBundleId,
            documentId: draggedItem.id,
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
      <div
        ref={setRootRef}
        className={`
          h-full transition-colors
          ${isOverRoot ? 'bg-blue-50 border-2 border-dashed border-blue-400 rounded p-2' : ''}
        `}
      >
        {/* Header */}
        <FileExplorerHeader
          folder={tree}
          level={level}
          isExpanded={isExpanded}
        />
        {isExpanded && (
          <FileItemWrapper
            folder={tree}
            level={level}
            activeItem={activeItem}
            overId={overId}
            activeId={activeId}
          />
        )}
      </div>
    </DndContext>
  );
};

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
function findParentId(folder: Tree | Children, childId: string): string | null {
  if (!folder.children) {
    return null;
  }

  // Check if child is direct descendant
  const isDirectChild = folder.children.some(child => child.id === childId);
  if (isDirectChild) {
    return folder.id.startsWith('bundle-') ? null : folder.id;
  }

  // Recursively search in subfolders
  for (const child of folder.children) {
    if (child.type === 'folder' && child.children) {
      const parentId = findParentId(child, childId);
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
