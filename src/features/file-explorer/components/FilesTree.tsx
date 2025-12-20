/**
 * File Tree Component
 *
 * Responsibilites:
 * Renders Header Action bar and the file tree
 *
 * Notes:
 *
 * Author: Anik Dey
 */
import type React from 'react';
import { useAppSelector } from '../../../app/hooks';
import type { Tree, Children } from '../fileTreeSlice';
import FileExplorerHeader from './FileExplorerHeader';
import FileItemWrapper from './FileItemWrapper';

type FileTreeProps = {
  tree: Tree | Children;
  level: number;
};

const FilesTree: React.FC<FileTreeProps> = ({ tree, level }) => {
  const expandedFolders = useAppSelector(
    state => state.fileTree.expandedFolders
  );
  const isExpanded = expandedFolders.includes(tree.id);

  return (
    <div>
      {/* Header */}
      <FileExplorerHeader folder={tree} level={level} isExpanded={isExpanded} />

      {isExpanded && <FileItemWrapper folder={tree} level={level} />}
    </div>
  );
};

export default FilesTree;
