export type FileNode = {
  id: string; // unique identifier
  name: string; // file or folder name
  type: 'file' | 'folder';
  children?: FileNode[]; // only present if type is "folder"
};
