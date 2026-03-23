import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type React from 'react';

import { useAppSelector } from '@/app/hooks';
import type { FileTreeDropPreview, FileTreeNode } from '../types/fileTree';

import CreateNewFolderInput from './CreateNewFolderInput';
import SortableFileItem from './nodes/SortableFileItem';
import SortableFolderItem from './nodes/SortableFolderItem';

const EMPTY_IDS: ReadonlyArray<string> = Object.freeze([]);

interface TreeChildrenProps {
  parentId: string | null;
  activeItem: FileTreeNode | null;
  overId?: string | null;
  activeId: string | null;
  selectedFileIds: string[];
  onFileSelect: (
    fileId: string,
    modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
  ) => void;
  onFolderSelect: (folderId: string) => void;
  dropPreview: FileTreeDropPreview | null;
}

/**
 * Renders the ordered children list for a single parent (root or folder).
 *
 * Why this exists:
 * - `@dnd-kit/sortable` needs one `SortableContext` per list of siblings.
 * - Every folder has its own ordered `children[parentId]` array.
 * - So folders recursively render `TreeChildren` to create nested sortable lists.
 */
const TreeChildren = ({
  parentId,
  activeItem,
  overId,
  activeId,
  selectedFileIds,
  onFileSelect,
  onFolderSelect,
  dropPreview,
}: TreeChildrenProps) => {
  const scrollToFileId = useAppSelector(state => state.fileTree.scrollToFileId);
  const isCreating = useAppSelector(state => state.fileTree.isCreatingNewFolder);

  const childIds = useAppSelector(state =>
    parentId === null
      ? state.fileTree.tree.rootIds
      : state.fileTree.tree.children[parentId] ?? (EMPTY_IDS as string[])
  );

  const shouldShowCreateInput = isCreating && parentId === null;
  const isContentHover = parentId !== null && overId === `${parentId}::content`;

  const effectiveDropPreview =
    dropPreview?.parentId === parentId
      ? dropPreview
      : isContentHover
        ? { parentId, index: 0 }
        : null;

  const shouldShowDropPreview = Boolean(effectiveDropPreview);

  const renderDropIndicator = (key: string) => (
    <div key={key} className="relative h-0">
      <div className="absolute -top-px left-2 right-2 h-1 rounded-full bg-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)] transition-all duration-150 ease-out" />
    </div>
  );

  return (
    <SortableContext items={childIds as string[]} strategy={verticalListSortingStrategy}>
      {shouldShowCreateInput && <CreateNewFolderInput parentId={null} />}

      {childIds.length === 0 ? (
        <>
          {shouldShowDropPreview && effectiveDropPreview?.index === 0
            ? renderDropIndicator(`drop-empty-${parentId ?? 'root'}`)
            : null}
          <div className="px-2 py-1 text-xs text-gray-400">No items yet</div>
        </>
      ) : (
        childIds.map((childId, index) => (
          <TreeNode
            key={childId}
            childId={childId}
            index={index}
            parentId={parentId}
            shouldShowDropPreview={shouldShowDropPreview}
            effectiveDropPreview={effectiveDropPreview}
            dropPreview={dropPreview}
            renderDropIndicator={renderDropIndicator}
            activeItem={activeItem}
            overId={overId}
            activeId={activeId}
            selectedFileIds={selectedFileIds}
            scrollToFileId={scrollToFileId}
            onFileSelect={onFileSelect}
            onFolderSelect={onFolderSelect}
          />
        ))
      )}

      {shouldShowDropPreview && effectiveDropPreview?.index === childIds.length
        ? renderDropIndicator(`drop-end-${parentId ?? 'root'}`)
        : null}
    </SortableContext>
  );
};

type TreeNodeProps = {
  childId: string;
  index: number;
  parentId: string | null;
  shouldShowDropPreview: boolean;
  effectiveDropPreview: FileTreeDropPreview | null;
  dropPreview: FileTreeDropPreview | null;
  renderDropIndicator: (key: string) => React.ReactNode;
  activeItem: FileTreeNode | null;
  overId?: string | null;
  activeId: string | null;
  selectedFileIds: string[];
  scrollToFileId: string | null;
  onFileSelect: (
    fileId: string,
    modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
  ) => void;
  onFolderSelect: (folderId: string) => void;
};

// Split into its own component so each row can subscribe to its own node
// without calling hooks inside a render loop.
const TreeNode = ({
  childId,
  index,
  parentId,
  shouldShowDropPreview,
  effectiveDropPreview,
  dropPreview,
  renderDropIndicator,
  activeItem,
  overId,
  activeId,
  selectedFileIds,
  scrollToFileId,
  onFileSelect,
  onFolderSelect,
}: TreeNodeProps) => {
  const node = useAppSelector(state => state.fileTree.tree.nodes[childId] ?? null);
  if (!node) {
    return null;
  }

  const isOver = overId === childId;

  return (
    <div>
      {shouldShowDropPreview && effectiveDropPreview?.index === index
        ? renderDropIndicator(`drop-${parentId ?? 'root'}-${index}`)
        : null}

      {node.type === 'folder' ? (
        <SortableFolderItem
          folderId={childId}
          onSelect={() => onFolderSelect(childId)}
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
          fileId={childId}
          isSelected={selectedFileIds.includes(childId)}
          onSelect={modifiers => onFileSelect(childId, modifiers)}
          shouldScrollIntoView={scrollToFileId === childId}
        />
      )}
    </div>
  );
};

export default TreeChildren;
