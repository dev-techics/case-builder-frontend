/**
 * File Tree Component
 *
 * Responsibilities:
 * - Renders the explorer header and the file tree with drag-and-drop context
 * - Manages multi-selection (shift / ctrl) for file drags
 *
 * Author: Anik Dey
 */

import type React from 'react';
import {
  closestCenter,
  DragOverlay,
  DndContext,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleFolder } from '../redux/fileTreeSlice';
import FileTreeBulkActions from './FileTreeBulkActions';
import FileTreeHeader from './FileTreeHeader';
import TreeChildren from './TreeChildren';
import {
  ROOT_DROPPABLE_ID,
  useFileTreeInteractions,
} from '../hooks/useFileTreeInteractions';
import { resolveBundleId } from '@/lib/bundleId';

type FilesTreeProps = {
  level: number;
};

const FilesTree: React.FC<FilesTreeProps> = ({ level }) => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const expanded = useAppSelector(state => state.fileTree.expanded);
  const rootExpanded = Boolean(expanded[tree.id]);

  const { bundleId: routeBundleId } = useParams<{ bundleId: string }>();
  const extractedBundleId =
    resolveBundleId({ routeBundleId, treeId: tree.id }) ?? '';

  const { setNodeRef: setRootDropRef, isOver: isRootOver } = useDroppable({
    id: ROOT_DROPPABLE_ID,
    data: { type: 'root' },
  });

  const {
    sensors,
    activeId,
    overId,
    activeItem,
    activeDragCount,
    selectedFileIds,
    dropPreview,
    onFolderSelect,
    onFileSelect,
    onDragStart,
    onDragOver,
    onDragEnd,
  } = useFileTreeInteractions({
    tree,
    bundleId: extractedBundleId,
  });

  const rootLabel = tree.projectName || tree.name;

  return (
    <>
      <FileTreeHeader
        folderId={tree.id}
        label={rootLabel}
        level={level}
        isExpanded={rootExpanded}
        onToggle={() => dispatch(toggleFolder(tree.id))}
      />
      <FileTreeBulkActions bundleId={extractedBundleId} />

      <DndContext
        sensors={sensors}
        collisionDetection={args =>
          pointerWithin(args) ?? rectIntersection(args) ?? closestCenter(args)
        }
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {rootExpanded && (
          <div
            ref={setRootDropRef}
            className={`min-h-[16px] ${isRootOver ? 'bg-blue-50' : ''}`}
          >
            <TreeChildren
              parentId={null}
              activeItem={activeItem}
              overId={overId}
              activeId={activeId}
              selectedFileIds={selectedFileIds}
              onFileSelect={onFileSelect}
              onFolderSelect={onFolderSelect}
              dropPreview={dropPreview}
            />
          </div>
        )}

        <DragOverlay>
          {activeId && activeItem ? (
            <div className="pointer-events-none flex items-center bg-white shadow-xl rounded px-3 py-2 opacity-90 truncate">
              <button
                className="mr-1 w-4 flex-shrink-0 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing"
                type="button"
              >
                <GripVertical className="h-4 w-4 text-gray-500" />
              </button>
              <span className="truncate text-gray-800 text-sm">
                {activeDragCount > 1
                  ? `${activeDragCount} files`
                  : activeItem.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default FilesTree;
