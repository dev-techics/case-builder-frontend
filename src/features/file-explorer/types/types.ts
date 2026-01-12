export type FileNode = {
  id: string;
  parentId: string | null;
  name: string;
  type: 'file';
  url: string; // Blob URL for the PDF file
};

export type FolderNode = {
  id: string;
  name: string;
  type: 'folder';
  children: FileNode[];
};

export type TreeNode = FileNode | FolderNode;

export type FileTreeState = {
  tree: FolderNode;
  expandedFolders: string[];
  selectedFile: string | null;
  scrollToFileId: string | null; // Track which file to scroll to in sidebar
};
