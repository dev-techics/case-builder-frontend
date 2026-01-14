// src/features/file-explorer/components/FileItemWrapper.tsx
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import SortableFileItem from './SortableFileItem';
import SortableFolderItem from './SortableFolderItem';
import {
  reorderFiles,
  selectFile,
  moveDocument,
  type Tree,
  type Children,
  reorderDocuments,
} from '../redux/fileTreeSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useParams } from 'react-router-dom';
import CreateNewFolderInput from './CreateNewFolderInput';
import { GripVertical } from 'lucide-react';

interface FileItemWrapperProps {
  folder: Tree | Children;
  level: number;
}

const FileItemWrapper = ({ folder, level }: FileItemWrapperProps) => {
  const dispatch = useAppDispatch();
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);
  const isCreating = useAppSelector(
    state => state.fileTree.isCreatingNewFolder
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const { bundleId } = useParams<{ bundleId: string }>();
  const extractedBundleId = bundleId || folder.id.replace('bundle-', '');

  // Get the item being dragged
  const activeItem = activeId ? findItemById(folder, activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId((over?.id as string) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Find the dragged item and target
    const draggedItem = findItemById(folder, active.id as string);
    const targetItem = findItemById(folder, over.id as string);

    if (!draggedItem) {
      console.error('Could not find dragged item');
      return;
    }

    // CASE 1: Dropping onto a folder (move into folder)
    if (targetItem?.type === 'folder') {
      console.log(
        `📁 Moving ${draggedItem.name} into folder ${targetItem.name}`
      );

      await dispatch(
        moveDocument({
          bundleId: extractedBundleId,
          documentId: draggedItem.id,
          newParentId: targetItem.id,
        })
      );
      return;
    }

    // CASE 2: Dropping onto a file (reorder within same parent)
    if (targetItem?.type === 'file') {
      const draggedParentId = findParentId(folder, draggedItem.id);
      const targetParentId = findParentId(folder, targetItem.id);

      // If different parents, move to target's parent
      if (draggedParentId !== targetParentId) {
        console.log(
          `📂 Moving ${draggedItem.name} to same folder as ${targetItem.name}`
        );

        await dispatch(
          moveDocument({
            bundleId: extractedBundleId,
            documentId: draggedItem.id,
            newParentId: targetParentId,
          })
        );
        return;
      }

      // Same parent - just reorder
      const parentFolder = draggedParentId
        ? findItemById(folder, draggedParentId)
        : folder;

      if (!parentFolder?.children) {
        return;
      }

      const oldIndex = parentFolder.children.findIndex(
        child => child.id === active.id
      );
      const newIndex = parentFolder.children.findIndex(
        child => child.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      console.log(`🔄 Reordering within same parent`);

      // Optimistic update
      dispatch(reorderFiles({ oldIndex, newIndex }));

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
        const result = await dispatch(
          reorderDocuments({
            bundleId: extractedBundleId,
            items,
          })
        );

        if (reorderDocuments.fulfilled.match(result)) {
          console.log('✅ Reorder saved successfully');
        }
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }
  };

  const handleFileSelect = (fileId: string) => {
    dispatch(selectFile(fileId));
  };

  if (!folder.children || folder.children.length === 0) {
    return null;
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={folder.children.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {isCreating && <CreateNewFolderInput parentId={selectedFile} />}
        {folder.children.map(child => {
          const isOver = overId === child.id;

          if (child.type === 'folder') {
            return (
              <SortableFolderItem
                key={child.id}
                onSelect={() => handleFileSelect(child.id)}
                folder={child}
                level={level + 1}
                isDropTarget={isOver && activeItem?.type === 'file'}
              />
            );
          }

          return (
            <SortableFileItem
              key={child.id}
              file={child}
              isSelected={selectedFile === child.id}
              level={level + 1}
              onSelect={() => handleFileSelect(child.id)}
              shouldScrollIntoView={scrollToFileId === child.id}
            />
          );
        })}
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="flex items-center bg-white shadow-xl rounded px-3 py-2 opacity-90 truncate">
            <button
              className="mr-1 w-4 flex-shrink-0 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing"
              type="button"
            >
              <GripVertical className="h-4 w-4 text-gray-500" />
            </button>
            <span className="truncate text-gray-800 text-sm">
              {activeItem.name}
            </span>
          </div>
        ) : null}
      </DragOverlay>
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

export default FileItemWrapper;
