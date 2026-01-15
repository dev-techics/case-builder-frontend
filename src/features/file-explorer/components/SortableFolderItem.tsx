/**
 * Sortable Folder Item Component
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  renameDocument,
  toggleFolder,
  type Children,
} from '@/features/file-explorer/redux/fileTreeSlice';
import ActionMenu from './FileActionMenu';
import FileItemWrapper from './FileItemWrapper';
import { Folder01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import ImportDocuments from './ImportDocuments';

type SortableFolderItemProps = {
  folder: Children;
  onSelect: () => void;
  level: number;
  isDropTarget?: boolean;
  activeId: string | null;
  overId?: string | null;
  activeItem: Children | null;
};

const SortableFolderItem: React.FC<SortableFolderItemProps> = ({
  folder,
  level,
  onSelect,
  isDropTarget = false,
  activeId,
  overId,
  activeItem,
}) => {
  const folderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const { expandedFolders, selectedFile } = useAppSelector(
    state => state.fileTree
  );

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);

  const isExpanded = expandedFolders.includes(folder.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: folder.id,
    data: {
      type: 'folder',
      folder: folder,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleFolderClick = () => {
    if (!isRenaming) {
      dispatch(toggleFolder(folder.id));
    }
    onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFolderClick();
    }
  };

  const handleDragKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleDragClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleRenameClick = () => {
    setIsRenaming(true);
    setRenameValue(folder.name);
  };

  const handleRenameSubmit = () => {
    const trimmedValue = renameValue.trim();
    if (trimmedValue && trimmedValue !== folder.name) {
      dispatch(
        renameDocument({ documentId: folder.id, newName: trimmedValue })
      );
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(folder.name);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleRenameCancel();
    }
    e.stopPropagation();
  };

  const handleRenameBlur = () => {
    handleRenameSubmit();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Show drop indicator when hovering
  const showDropIndicator = overId === folder.id && !isDragging;

  return (
    <div ref={setNodeRef} style={style}>
      {/* Folder Header */}
      <div
        ref={folderRef}
        className={`
          flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left 
          hover:bg-gray-200 transition-colors
          ${showDropIndicator ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
        `}
        onClick={handleFolderClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center truncate flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            aria-label={`Drag ${folder.name}`}
            className="mr-1 w-4 flex-shrink-0 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing"
            onClick={handleDragClick}
            onKeyDown={handleDragKeyDown}
            type="button"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </button>

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="mr-1 h-4 w-4 flex-shrink-0 text-gray-600" />
          ) : (
            <ChevronRight className="mr-1 h-4 w-4 flex-shrink-0 text-gray-600" />
          )}

          {/* Folder Icon */}
          <HugeiconsIcon
            icon={Folder01Icon}
            className={`mr-2 h-4 w-4 flex-shrink-0 transition-colors ${
              showDropIndicator ? 'text-blue-600' : 'text-blue-400'
            }`}
          />

          {/* Folder Name or Rename Input */}
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameBlur}
              onClick={handleInputClick}
              className="truncate text-gray-800 text-sm bg-white border border-blue-500 rounded px-1 py-0.5 outline-none flex-1 min-w-0"
            />
          ) : (
            <span className="truncate text-gray-800 text-sm font-medium">
              {folder.name}
            </span>
          )}
        </div>

        {/* Import Documents inside a folder */}
        <div>
          <ImportDocuments bundleId={folder.id} parentId={selectedFile} />
        </div>

        {/* Action Menu */}
        <ActionMenu file={folder} onRenameClick={handleRenameClick} />
      </div>

      {/* Nested Children */}
      {isExpanded && folder.children && folder.children.length > 0 && (
        <div style={{ paddingLeft: `${12}px` }}>
          <FileItemWrapper
            folder={folder}
            level={level}
            activeItem={activeItem}
            overId={overId}
            activeId={activeId}
          />
        </div>
      )}
    </div>
  );
};

export default SortableFolderItem;
