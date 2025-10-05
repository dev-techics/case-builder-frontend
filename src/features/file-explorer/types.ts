export type FileNode = {
  id: string;
  name: string;
  type: "file";
  url?: string; // URL or blob URL for the PDF file
  file?: File; // Original File object if uploaded
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
