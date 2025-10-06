export type FileNode = {
  id: string;
  name: string;
  type: "file";
  url?: string; // Blob URL for the PDF file
  // Don't store File object in Redux - it's non-serializable
};

export type FolderNode = {
  id: string;
  name: string;
  type: "folder";
  children: FileNode[];
};

export type TreeNode = FileNode | FolderNode;

export type FileTreeState = {
  tree: FolderNode;
  expandedFolders: string[];
  selectedFile: string | null;
  scrollToFileId: string | null; // Track which file to scroll to in sidebar
};
