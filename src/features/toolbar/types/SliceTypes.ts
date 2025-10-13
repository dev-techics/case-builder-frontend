export type HighlightColor = {
  name: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
  opacity: number;
};

export type Highlight = {
  id: string;
  fileId: string; // Which file this highlight belongs to
  pageNumber: number; // Which page in that file
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
  color: HighlightColor;
  createdAt?: number; // Optional: timestamp
};

export type PendingHighlight = {
  fileId: string;
  pageNumber: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
};

// Comment object
type Comment = {
  id: string;
  fileId: string;
  pageNumber: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
  createdAt?: number;
};

export type EditorState = {
  ToolbarPosition: { x: number | null; y: number | null };
  pendingHighlight: PendingHighlight | null;
  highlights: Highlight[]; // Array to store multiple highlights
  comments: Comment[];
};
