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
} from '../fileTreeSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

interface FileItemWrapperProps {
  folder: Tree | Children;
  level: number;
}

const FileItemWrapper = ({ folder, level }: FileItemWrapperProps) => {
  const dispatch = useAppDispatch();
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && folder.children) {
      const oldIndex = folder.children.findIndex(
        child => child.id === active.id
      );
      const newIndex = folder.children.findIndex(child => child.id === over.id);

      dispatch(reorderFiles({ oldIndex, newIndex }));
    }
  };

  const handleFileSelect = (fileId: string) => {
    dispatch(selectFile(fileId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
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
