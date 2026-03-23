/**
 * Single File Item
 *
 * Responsibilities:
 * - Display a single file in the left sidebar with action menu for rename and delete
 *
 * Author: Anik Dey
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { HugeiconsIcon } from '@hugeicons/react';
import { File02Icon } from '@hugeicons/core-free-icons';

import { useAppSelector } from '@/app/hooks';
import ActionMenu from '../FileActionMenu';
import { useRenameDocumentMutation } from '../../api';

type SortableFileItemProps = {
  fileId: string;
  isSelected: boolean;
  shouldScrollIntoView: boolean;
  onSelect: (modifiers?: {
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
  }) => void;
};

const SortableFileItem: React.FC<SortableFileItemProps> = ({
  fileId,
  isSelected,
  shouldScrollIntoView,
  onSelect,
}) => {
  const fileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [renameDocument] = useRenameDocumentMutation();

  const file = useAppSelector(state => state.fileTree.tree.nodes[fileId] ?? null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file?.name ?? '');

  useEffect(() => {
    if (!isRenaming && file) {
      setRenameValue(file.name);
    }
  }, [file?.name, file, isRenaming]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fileId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  useEffect(() => {
    if (shouldScrollIntoView && fileRef.current) {
      fileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [shouldScrollIntoView]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  if (!file || file.type !== 'file') {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
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
    setRenameValue(file.name);
  };

  const handleRenameSubmit = () => {
    const trimmedValue = renameValue.trim();
    if (trimmedValue && trimmedValue !== file.name) {
      renameDocument({ documentId: file.id, newName: trimmedValue });
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(file.name);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
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

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelect({
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    });
  };

  return (
    <div
      aria-pressed={isSelected}
      className={`select-none flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left hover:bg-gray-200 ${
        isSelected ? 'bg-blue-100 ring-1 ring-inset ring-blue-300' : ''
      }`}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      ref={node => {
        setNodeRef(node);
        if (node) {
          (fileRef as any).current = node;
        }
      }}
      role="button"
      style={style}
      tabIndex={0}
    >
      <div className="flex items-center truncate flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${file.name}`}
          className="mr-1 w-4 flex-shrink-0 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing"
          onClick={handleDragClick}
          onKeyDown={handleDragKeyDown}
          type="button"
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </button>
        <HugeiconsIcon
          icon={File02Icon}
          className="mr-2 h-4 w-4 flex-shrink-0 text-gray-800"
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
          <span className="select-none truncate text-gray-800 text-sm" title={file.name}>
            {file.name}
          </span>
        )}
      </div>

      <ActionMenu file={file} onRenameClick={handleRenameClick} />
    </div>
  );
};

export default SortableFileItem;
