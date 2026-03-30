export type FileTreeNodeType = 'file' | 'folder';

export type FileTreeNodeId = string;

export interface FileTreeNodeBase {
  id: FileTreeNodeId;
  name: string;
  type: FileTreeNodeType;
  parentId: FileTreeNodeId | null;
}

export interface FileTreeFileNode extends FileTreeNodeBase {
  type: 'file';
  url?: string;
}

export interface FileTreeFolderNode extends FileTreeNodeBase {
  type: 'folder';
}

export type FileTreeNode = FileTreeFileNode | FileTreeFolderNode;

export type FileTreeDropPreview = {
  parentId: FileTreeNodeId | null;
  index: number;
};

/**
 * Normalized, flat tree optimized for UI updates.
 *
 * - `nodes`: metadata by id
 * - `children`: ordered ids by parent folder id (no nested children on nodes)
 * - `rootIds`: ordered ids at the root level (nodes with `parentId === null`)
 */
export interface FileTree {
  id: string;
  name: string;
  projectName?: string;
  type: 'folder';
  indexUrl?: string;
  nodes: Record<FileTreeNodeId, FileTreeNode>;
  children: Record<FileTreeNodeId, FileTreeNodeId[]>;
  rootIds: FileTreeNodeId[];
}

/**
 * Server tree shape (legacy): nodes carry `children` and use `parent` (or `parentId`).
 * Keep this type local to the feature so we can normalize into `FileTree`.
 */
export interface ServerFileTreeNode {
  id: string | number;
  name: string;
  type: FileTreeNodeType;
  url?: string;
  children?: Array<string | number> | null;
  parent?: string | null;
  parentId?: string | null;
  parent_id?: string | null;
}

export interface ServerTree {
  id: string;
  name: string;
  projectName?: string;
  type: 'folder';
  children?: Array<string | number>;
  nodes: ServerFileTreeNode[];
}
