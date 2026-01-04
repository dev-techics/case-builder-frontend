import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableFileItem from './SortableFileItem';
import SortableFolderItem from './SortableFolderItem';
import {
  reorderFiles,
  selectFile,
  type Tree,
  type Children,
  reorderDocuments,
} from '../redux/fileTreeSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useParams } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';

interface FileItemWrapperProps {
  folder: Tree | Children;
  level: number;
}

const FileItemWrapper = ({ folder, level }: FileItemWrapperProps) => {
  const dispatch = useAppDispatch();
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);

  // Get bundleId from route params or folder id
  const { bundleId } = useParams<{ bundleId: string }>();

  // Extract numeric bundle ID from folder.id (e.g., "bundle-123" -> "123")
  const extractedBundleId = bundleId || folder.id.replace('bundle-', '');

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && folder.children) {
      const oldIndex = folder.children.findIndex(
        child => child.id === active.id
      );
      const newIndex = folder.children.findIndex(child => child.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        console.error('Could not find item indices');
        return;
      }

      // 1. Optimistic update (immediate UI feedback)
      dispatch(reorderFiles({ oldIndex, newIndex }));

      // 2. Calculate new order for ALL items
      const reorderedChildren = arrayMove(folder.children, oldIndex, newIndex);

      // Create array with new order positions
      const items = reorderedChildren.map((child, index) => ({
        id: child.id,
        order: index, // New order position (0-indexed)
      }));

      console.log('Sending reorder to server:', items);

      // 3. Send to backend
      try {
        const result = await dispatch(
          reorderDocuments({
            bundleId: extractedBundleId,
            items,
          })
        );

        if (reorderDocuments.fulfilled.match(result)) {
          console.log('✅ Reorder saved successfully');
        } else if (reorderDocuments.rejected.match(result)) {
          console.error('❌ Reorder failed:', result.payload);
          // Optionally: reload tree to get correct order from server
          // dispatch(loadTreeFromBackend(parseInt(extractedBundleId)));
        }
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }
  };

  const handleFileSelect = (fileId: string) => {
    dispatch(selectFile(fileId));
  };

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

  // Safety check - early return if no children
  if (!folder.children || folder.children.length === 0) {
    return null;
  }

  return (
    <div>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={folder.children.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {folder.children.map(child => {
            // Conditionally render based on type
            if (child.type === 'folder') {
              return (
                <SortableFolderItem
                  key={child.id}
                  folder={child}
                  level={level + 1}
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
      </DndContext>
    </div>
  );
};

export default FileItemWrapper;
