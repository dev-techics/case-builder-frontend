import { MAX_NAME_LENGTH } from '../constants';
import type { FileTreeNode } from '@/features/file-explorer/types/fileTree';

/*-----------------------------------------------
Returns true/false if files exists in the bundle
-------------------------------------------------*/
export const hasAnyFiles = (
  rootIds: ReadonlyArray<string>,
  nodes: Record<string, FileTreeNode>,
  childrenByParentId: Record<string, string[]>
): boolean => {
  for (const id of rootIds) {
    const node = nodes[id];
    if (!node) continue;

    if (node.type === 'file') return true;

    const childIds = childrenByParentId[node.id] ?? [];
    if (
      childIds.length > 0 &&
      hasAnyFiles(childIds, nodes, childrenByParentId)
    ) {
      return true;
    }
  }

  return false;
};

/*------------------------------- 
 Truncate file name if to large
---------------------------------*/
export const truncateLabel = (value: string): string =>
  value.length <= MAX_NAME_LENGTH
    ? value
    : `${value.slice(0, MAX_NAME_LENGTH - 3)}…`;
