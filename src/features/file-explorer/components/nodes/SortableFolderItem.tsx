/**
 * Sortable Folder Item Component
 */
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleFolder } from '@/features/file-explorer/redux/fileTreeSlice';
import type { FileTreeDropPreview, FileTreeNode } from '@/features/file-explorer/types/fileTree';

import ActionMenu from '../FileActionMenu';
import TreeChildren from '../TreeChildren';
import ImportDocuments from '../ImportDocuments';

import { Folder01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRenameDocumentMutation } from '../../api';

const EMPTY_IDS: ReadonlyArray<string> = Object.freeze([]);

type SortableFolderItemProps = {
  folderId: string;
  onSelect: () => void;
  isDropTarget?: boolean;
  activeId: string | null;
  overId?: string | null;
  activeItem: FileTreeNode | null;
  selectedFileIds: string[];
  onFileSelect: (
    fileId: string,
    modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
  ) => void;
  onFolderSelect: (folderId: string) => void;
  dropPreview: FileTreeDropPreview | null;
};

const SortableFolderItem: React.FC<SortableFolderItemProps> = ({
  folderId,
  onSelect,
  isDropTarget,
  activeId,
  overId,
  activeItem,
  selectedFileIds,
  onFileSelect,
  onFolderSelect,
  dropPreview,
}) => {
  const folderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const [renameDocument] = useRenameDocumentMutation();

  const folder = useAppSelector(state => state.fileTree.tree.nodes[folderId] ?? null);
  const isExpanded = useAppSelector(state => Boolean(state.fileTree.expanded[folderId]));
  const childIds = useAppSelector(
    state => state.fileTree.tree.children[folderId] ?? (EMPTY_IDS as string[])
  );

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder?.name ?? '');

  useEffect(() => {
    if (!isRenaming && folder) {
      setRenameValue(folder.name);
    }
  }, [folder?.name, folder, isRenaming]);

  const isFileDragActive = activeItem?.type === 'file';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folderId,
    data: { type: 'folder', folderId },
    disabled: isFileDragActive,
  });

  const { setNodeRef: setDropRef, isOver: isOverDroppable } = useDroppable({
    id: folderId,
    data: { type: 'folder', accepts: ['file', 'folder'] },
  });

  const contentDropId = `${folderId}::content`;
  const { setNodeRef: setContentDropRef, isOver: isOverContent } = useDroppable({
    id: contentDropId,
    data: { type: 'folder-content', folderId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  if (!folder || folder.type !== 'folder') {
    return null;
  }

  const handleFolderClick = () => {
    if (!isRenaming) {
      dispatch(toggleFolder(folderId));
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
      renameDocument({ documentId: folderId, newName: trimmedValue });
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

  const showDropIndicator =
    (Boolean(isDropTarget) || isOverDroppable || overId === contentDropId) &&
    activeItem?.id !== folderId &&
    !isDragging;

  const isInsideContentHover = overId === contentDropId;
  const isEmpty = childIds.length === 0;

  useEffect(() => {
    if (!activeId || isExpanded || !isOverDroppable) {
      return;
    }

    const timeout = window.setTimeout(() => {
      dispatch(toggleFolder(folderId));
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [activeId, dispatch, folderId, isExpanded, isOverDroppable]);

  return (
    <div
      ref={node => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
    >
      <div
        ref={folderRef}
        className="select-none flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left hover:bg-gray-200 transition-colors"
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center truncate flex-1 min-w-0">
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

          {isExpanded ? (
            <ChevronDown
              onClick={handleFolderClick}
              className="mr-1 h-4 w-4 flex-shrink-0 text-gray-600"
            />
          ) : (
            <ChevronRight
              onClick={handleFolderClick}
              className="mr-1 h-4 w-4 flex-shrink-0 text-gray-600"
            />
          )}

          <HugeiconsIcon
            icon={Folder01Icon}
            className={`mr-2 h-4 w-4 flex-shrink-0 transition-colors ${
              showDropIndicator ? 'text-blue-600' : 'text-blue-400'
            }`}
          />

          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameBlur}
              onClick={handleInputClick}
              className="select-text truncate text-gray-800 text-sm bg-white border border-blue-500 rounded px-1 py-0.5 outline-none flex-1 min-w-0"
            />
          ) : (
            <span
              className="select-none truncate text-gray-800 text-sm font-medium"
              title={folder.name}
            >
              {folder.name}
            </span>
          )}
        </div>

        <div>
          <ImportDocuments bundleId={folderId} parentId={folderId} />
        </div>

        <ActionMenu file={folder} onRenameClick={handleRenameClick} />
      </div>

      {isInsideContentHover && (!isExpanded || isEmpty) ? (
        <div className="px-4 py-1">
          <div className="h-1 rounded-full bg-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]" />
        </div>
      ) : null}

      {isExpanded && (
        <div style={{ paddingLeft: `${12}px` }}>
          {/* Recursive children list (each folder renders its own sortable siblings). */}
          {isEmpty ? (
            <div
              ref={setContentDropRef}
              className={`rounded ${
                isOverContent ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              }`}
            >
              <TreeChildren
                parentId={folderId}
                activeItem={activeItem}
                overId={overId}
                activeId={activeId}
                selectedFileIds={selectedFileIds}
                onFileSelect={onFileSelect}
                onFolderSelect={onFolderSelect}
                dropPreview={dropPreview}
              />
            </div>
          ) : (
            <TreeChildren
              parentId={folderId}
              activeItem={activeItem}
              overId={overId}
              activeId={activeId}
              selectedFileIds={selectedFileIds}
              onFileSelect={onFileSelect}
              onFolderSelect={onFolderSelect}
              dropPreview={dropPreview}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SortableFolderItem;
