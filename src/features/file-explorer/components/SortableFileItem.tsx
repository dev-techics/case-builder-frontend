import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { File, GripVertical } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { FileNode } from '../types';
import Menu from './comp-366';

type SortableFileItemProps = {
  file: FileNode;
  level: number;
  isSelected: boolean;
  shouldScrollIntoView: boolean;
  onSelect: () => void;
};

export const SortableFileItem: React.FC<SortableFileItemProps> = ({
  file,
  isSelected,
  shouldScrollIntoView,
  onSelect,
}) => {
  const fileRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  // Scroll into view when this file should be highlighted
  useEffect(() => {
    if (shouldScrollIntoView && fileRef.current) {
      fileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [shouldScrollIntoView]);

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
  return (
    <div
      aria-pressed={isSelected}
      className={`flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left hover:bg-gray-200 ${
        isSelected ? 'bg-gray-300' : ''
      }`}
      onClick={onSelect}
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
      <div className="flex items-center truncate">
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
        <File className="mr-2 h-4 w-4 flex-shrink-0 text-gray-800" />
        <span className="truncate text-gray-800 text-sm">{file.name}</span>
      </div>
      {/* Rename and delete menu */}
      <Menu />
    </div>
  );
};
