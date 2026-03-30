import type {
  FileTree,
  FileTreeNode,
  FileTreeNodeId,
  ServerFileTreeNode,
} from '../types/fileTree';

const EMPTY_ARRAY: ReadonlyArray<string> = Object.freeze([]);

export const arraysEqual = (
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>
) => a.length === b.length && a.every((value, index) => value === b[index]);

const toId = (value: string | number): string => String(value);

export const getChildIds = (
  tree: FileTree,
  parentId: FileTreeNodeId | null
): ReadonlyArray<FileTreeNodeId> =>
  parentId === null ? tree.rootIds : (tree.children[parentId] ?? EMPTY_ARRAY);

const normalizeParentId = (
  rawParentId: unknown,
  treeId: string
): string | null => {
  if (rawParentId === null || rawParentId === undefined) {
    return null;
  }

  if (typeof rawParentId !== 'string') {
    return null;
  }

  if (rawParentId === treeId || rawParentId === 'root') {
    return null;
  }

  if (rawParentId.startsWith('bundle-')) {
    return null;
  }

  return rawParentId;
};

export const normalizeTreeParentId = (
  rawParentId: unknown,
  treeId: string
): string | null => normalizeParentId(rawParentId, treeId);

const readServerParentId = (node: ServerFileTreeNode): string | null => {
  const raw = node.parent ?? node.parentId ?? node.parent_id ?? null;
  return typeof raw === 'string' ? raw : null;
};

export const normalizeServerNode = (
  node: ServerFileTreeNode,
  treeId: string
): FileTreeNode => {
  const id = toId(node.id);
  const parentId = normalizeParentId(readServerParentId(node), treeId);

  const base = {
    id,
    name: node.name,
    type: node.type,
    parentId,
  } as const;

  return node.type === 'file'
    ? { ...base, type: 'file', url: node.url }
    : { ...base, type: 'folder' };
};

export const dedupeOrdered = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
};

const nodesEqual = (a: FileTreeNode, b: FileTreeNode): boolean => {
  if (a === b) return true;
  if (a.id !== b.id) return false;
  if (a.name !== b.name) return false;
  if (a.type !== b.type) return false;
  if (a.parentId !== b.parentId) return false;
  if (a.type === 'file' && b.type === 'file') {
    return a.url === b.url;
  }
  return true;
};

/**
 * Structural sharing merge.
 * Returns a tree that reuses previous node/array references when unchanged.
 */
export const mergeFileTree = (prev: FileTree, next: FileTree): FileTree => {
  const nextNodeIds = Object.keys(next.nodes);
  const prevNodeIds = Object.keys(prev.nodes);

  let nodesChanged = prevNodeIds.length !== nextNodeIds.length;
  if (!nodesChanged) {
    for (const id of nextNodeIds) {
      const prevNode = prev.nodes[id];
      const nextNode = next.nodes[id];
      if (!prevNode || !nodesEqual(prevNode, nextNode)) {
        nodesChanged = true;
        break;
      }
    }
  }

  const mergedNodes: Record<FileTreeNodeId, FileTreeNode> = nodesChanged
    ? Object.fromEntries(
        nextNodeIds.map(id => {
          const prevNode = prev.nodes[id];
          const nextNode = next.nodes[id];
          return [
            id,
            prevNode && nodesEqual(prevNode, nextNode) ? prevNode : nextNode,
          ];
        })
      )
    : prev.nodes;

  let childrenChanged = false;
  const prevChildrenKeys = Object.keys(prev.children);
  const nextChildrenKeys = Object.keys(next.children);
  if (prevChildrenKeys.length !== nextChildrenKeys.length) {
    childrenChanged = true;
  } else {
    for (const key of nextChildrenKeys) {
      const prevList = prev.children[key] ?? EMPTY_ARRAY;
      const nextList = next.children[key] ?? EMPTY_ARRAY;
      if (!arraysEqual(prevList, nextList)) {
        childrenChanged = true;
        break;
      }
    }
  }

  const mergedChildren: Record<FileTreeNodeId, FileTreeNodeId[]> =
    childrenChanged
      ? {}
      : (prev.children as Record<FileTreeNodeId, FileTreeNodeId[]>);

  if (childrenChanged) {
    for (const key of nextChildrenKeys) {
      const prevList = prev.children[key];
      const nextList = next.children[key] ?? [];
      mergedChildren[key] =
        prevList && arraysEqual(prevList, nextList) ? prevList : [...nextList];
    }
  }

  const rootIds = arraysEqual(prev.rootIds, next.rootIds)
    ? prev.rootIds
    : [...next.rootIds];

  const metadataChanged =
    prev.id !== next.id ||
    prev.name !== next.name ||
    prev.projectName !== next.projectName ||
    prev.indexUrl !== next.indexUrl ||
    prev.type !== next.type;

  return {
    ...(metadataChanged ? next : prev),
    nodes: mergedNodes,
    children: childrenChanged ? mergedChildren : prev.children,
    rootIds,
  };
};

const removeFromList = (list: FileTreeNodeId[], nodeIds: Set<FileTreeNodeId>) =>
  list.filter(id => !nodeIds.has(id));

export const insertNodeIntoTree = (tree: FileTree, node: FileTreeNode) => {
  if (tree.nodes[node.id]) {
    return;
  }

  const parentId = node.parentId;
  const parentNode = parentId ? tree.nodes[parentId] : null;

  tree.nodes[node.id] = node;

  if (parentId && parentNode?.type === 'folder') {
    const list = tree.children[parentId] ?? [];
    if (!list.includes(node.id)) {
      tree.children[parentId] = [...list, node.id];
    }
    return;
  }

  // Fallback: keep at root.
  node.parentId = null;
  if (!tree.rootIds.includes(node.id)) {
    tree.rootIds.push(node.id);
  }
};

export const removeNodeAndDescendantsFromTree = (
  tree: FileTree,
  nodeId: FileTreeNodeId
): Set<FileTreeNodeId> => {
  const target = tree.nodes[nodeId];
  if (!target) {
    return new Set();
  }

  const toRemove = new Set<FileTreeNodeId>();
  const stack: FileTreeNodeId[] = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (toRemove.has(currentId)) continue;
    toRemove.add(currentId);

    const current = tree.nodes[currentId];
    if (!current) continue;

    if (current.type === 'folder') {
      const childIds = tree.children[currentId] ?? EMPTY_ARRAY;
      for (const childId of childIds) {
        stack.push(childId);
      }
    }
  }

  // Remove references from root and remaining parents.
  tree.rootIds = removeFromList(tree.rootIds, toRemove);
  for (const [parentId, childIds] of Object.entries(tree.children)) {
    if (toRemove.has(parentId)) continue;
    const nextChildIds = removeFromList(childIds, toRemove);
    if (!arraysEqual(childIds, nextChildIds)) {
      if (nextChildIds.length === 0) {
        delete tree.children[parentId];
      } else {
        tree.children[parentId] = nextChildIds;
      }
    }
  }

  // Drop nodes and their children lists.
  for (const id of toRemove) {
    delete tree.nodes[id];
    delete tree.children[id];
  }

  return toRemove;
};

export const isDescendant = (
  tree: FileTree,
  ancestorId: FileTreeNodeId,
  targetId: FileTreeNodeId
): boolean => {
  if (ancestorId === targetId) return true;

  let current: FileTreeNodeId | null = targetId;
  while (current) {
    if (current === ancestorId) return true;
    const node: FileTreeNode | undefined = tree.nodes[current];
    if (!node) return false;
    current = node.parentId;
  }
  return false;
};
