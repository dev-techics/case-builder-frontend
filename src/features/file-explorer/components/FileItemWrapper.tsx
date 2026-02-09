// src/features/file-explorer/components/FileItemWrapper.tsx
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableFileItem from './SortableFileItem';
import SortableFolderItem from './SortableFolderItem';
import {
  selectFile,
  selectFolder,
  type Tree,
  type Children,
} from '../redux/fileTreeSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import CreateNewFolderInput from './CreateNewFolderInput';

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
  const selectedFolderId = useAppSelector(
    state => state.fileTree.selectedFolderId
  );
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);
  const isCreating = useAppSelector(
    state => state.fileTree.isCreatingNewFolder
  );

  const handleFileSelect = (fileId: string) => {
    dispatch(selectFile(fileId));
  };

  const handleFolderSelect = (folderId: string) => {
    dispatch(selectFolder(folderId));
  };

  const children = folder.children || [];
  const validChildren = children.filter(Boolean);
  const shouldShowCreateInput =
    isCreating &&
    (selectedFolderId ? selectedFolderId === folder.id : level === 0);

  return (
    <>
      <SortableContext
        items={validChildren.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* ---- create new folder input ------ */}
        {shouldShowCreateInput && (
          <CreateNewFolderInput parentId={selectedFolderId} />
        )}
        {validChildren.length === 0 ? (
          <div className="px-2 py-1 text-xs text-gray-400">No items yet</div>
        ) : (
          validChildren.map(child => {
            const isOver = overId === child.id;

            if (child.type === 'folder') {
              return (
                <SortableFolderItem
                  key={child.id}
                  onSelect={() => handleFolderSelect(child.id)}
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
          })
        )}
      </SortableContext>

    </>
  );
};

export default FileItemWrapper;
