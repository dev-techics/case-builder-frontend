// src/features/file-explorer/components/FileItemWrapper.tsx
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableFileItem from './SortableFileItem';
import SortableFolderItem from './SortableFolderItem';
import { type Tree, type Children } from '../redux/fileTreeSlice';
import { useAppSelector } from '@/app/hooks';
import CreateNewFolderInput from './CreateNewFolderInput';

interface FileItemWrapperProps {
  folder: Tree | Children;
  level: number;
  activeItem: Children | null;
  overId?: string | null;
  activeId: string | null;
  selectedFileIds: string[];
  onFileSelect: (
    fileId: string,
    modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
  ) => void;
  onFolderSelect: (folderId: string) => void;
}

const FileItemWrapper = ({
  folder,
  level,
  activeItem,
  overId,
  activeId,
  selectedFileIds,
  onFileSelect,
  onFolderSelect,
}: FileItemWrapperProps) => {
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);
  const isCreating = useAppSelector(
    state => state.fileTree.isCreatingNewFolder
  );

  const children = folder.children || [];
  const validChildren = children.filter(Boolean);
  const shouldShowCreateInput = isCreating && level === 0;

  return (
    <>
      <SortableContext
        items={validChildren.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* ---- create new folder input ------ */}
        {shouldShowCreateInput && <CreateNewFolderInput parentId={null} />}
        {validChildren.length === 0 ? (
          <div className="px-2 py-1 text-xs text-gray-400">No items yet</div>
        ) : (
          validChildren.map(child => {
            const isOver = overId === child.id;

            if (child.type === 'folder') {
              return (
                <SortableFolderItem
                  key={child.id}
                  onSelect={() => onFolderSelect(child.id)}
                  folder={child}
                  level={level + 1}
                  isDropTarget={isOver && activeItem?.type === 'file'}
                  activeId={activeId}
                  overId={overId}
                  activeItem={activeItem}
                  selectedFileIds={selectedFileIds}
                  onFileSelect={onFileSelect}
                  onFolderSelect={onFolderSelect}
                />
              );
            }

            return (
              <SortableFileItem
                key={child.id}
                file={child}
                isSelected={selectedFileIds.includes(child.id)}
                level={level + 1}
                onSelect={modifiers => onFileSelect(child.id, modifiers)}
                shouldScrollIntoView={scrollToFileId === child.id}
              />
            );
          })
        )}
      </SortableContext>
    </>
  );
};

export default FileItemWrapper;
