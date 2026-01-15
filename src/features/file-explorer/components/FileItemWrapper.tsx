// src/features/file-explorer/components/FileItemWrapper.tsx
import { DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableFileItem from './SortableFileItem';
import SortableFolderItem from './SortableFolderItem';
import { selectFile, type Tree, type Children } from '../redux/fileTreeSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import CreateNewFolderInput from './CreateNewFolderInput';
import { GripVertical } from 'lucide-react';

interface FileItemWrapperProps {
  folder: Tree | Children;
  level: number;
  activeItem: Children | null;
  overId?: string | null;
  activeId: string | null;
}

const FileItemWrapper = ({
  folder,
  level,
  activeItem,
  overId,
  activeId,
}: FileItemWrapperProps) => {
  const dispatch = useAppDispatch();
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);
  const isCreating = useAppSelector(
    state => state.fileTree.isCreatingNewFolder
  );

  const handleFileSelect = (fileId: string) => {
    dispatch(selectFile(fileId));
  };

  // Safety check for children
  const children = folder.children || [];

  if (children.length === 0) {
    return null;
  }

  // Filter out any undefined/null children
  const validChildren = children.filter(Boolean);

  return (
    <>
      <SortableContext
        items={validChildren.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {isCreating && <CreateNewFolderInput parentId={selectedFile} />}
        {validChildren.map(child => {
          const isOver = overId === child.id;

          if (child.type === 'folder') {
            return (
              <SortableFolderItem
                key={child.id}
                onSelect={() => handleFileSelect(child.id)}
                folder={child}
                level={level + 1}
                isDropTarget={isOver && activeItem?.type === 'file'}
                activeId={activeId}
                overId={overId}
                activeItem={activeItem}
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
    </>
  );
};

export default FileItemWrapper;
