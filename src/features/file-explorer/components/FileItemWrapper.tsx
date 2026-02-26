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
  dropPreview: { parentId: string | null; index: number } | null;
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
  dropPreview,
}: FileItemWrapperProps) => {
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);
  const isCreating = useAppSelector(
    state => state.fileTree.isCreatingNewFolder
  );

  const children = folder.children || [];
  const validChildren = children.filter(Boolean);
  const shouldShowCreateInput = isCreating && level === 0;
  const currentParentId =
    folder.id === 'root' || folder.id.startsWith('bundle-') ? null : folder.id;
  const isContentHover =
    currentParentId !== null && overId === `${currentParentId}::content`;
  const effectiveDropPreview =
    dropPreview?.parentId === currentParentId
      ? dropPreview
      : isContentHover
        ? { parentId: currentParentId, index: 0 }
        : null;
  const shouldShowDropPreview = Boolean(effectiveDropPreview);

  const renderDropIndicator = (key: string) => (
    <div key={key} className="relative h-0">
      <div className="absolute -top-px left-2 right-2 h-1 rounded-full bg-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)] transition-all duration-150 ease-out" />
    </div>
  );

  return (
    <>
      <SortableContext
        items={validChildren.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* ---- create new folder input ------ */}
        {shouldShowCreateInput && <CreateNewFolderInput parentId={null} />}
        {validChildren.length === 0 ? (
          <>
            {shouldShowDropPreview && effectiveDropPreview?.index === 0
              ? renderDropIndicator(`drop-empty-${currentParentId ?? 'root'}`)
              : null}
            <div className="px-2 py-1 text-xs text-gray-400">No items yet</div>
          </>
        ) : (
          validChildren.map((child, index) => {
            const isOver = overId === child.id;

            return (
              <div key={child.id}>
                {shouldShowDropPreview && effectiveDropPreview?.index === index
                  ? renderDropIndicator(`drop-${currentParentId ?? 'root'}-${index}`)
                  : null}
                {child.type === 'folder' ? (
                  <SortableFolderItem
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
                    dropPreview={dropPreview}
                  />
                ) : (
                  <SortableFileItem
                    file={child}
                    isSelected={selectedFileIds.includes(child.id)}
                    level={level + 1}
                    onSelect={modifiers => onFileSelect(child.id, modifiers)}
                    shouldScrollIntoView={scrollToFileId === child.id}
                  />
                )}
              </div>
            );
          })
        )}
        {shouldShowDropPreview && effectiveDropPreview?.index === validChildren.length
          ? renderDropIndicator(`drop-end-${currentParentId ?? 'root'}`)
          : null}
      </SortableContext>
    </>
  );
};

export default FileItemWrapper;
