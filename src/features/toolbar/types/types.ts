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
export type Comment = {
  id: string;
  fileId: string;
  pageNumber: number;
  text: string;
  selectedText?: string; // Optional: the text that was selected when comment was created
  position: {
    x: number;
    y: number;
    pageY: number; // Y position relative to the page (for scrolling)
  };
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  author?: string; // Optional: user who created the comment
};

export type PendingComment = {
  fileId: string;
  pageNumber: number;
  selectedText?: string;
  position: {
    x: number;
    y: number;
    pageY: number;
  };
};

export type EditorState = {
  ToolbarPosition: { x: number | null; y: number | null };
  CommentPosition: { x: number | null; y: number | null };
  pendingHighlight: PendingHighlight | null;
  pendingComment: PendingComment | null;
  highlights: Highlight[]; // Array to store multiple highlights
  comments: Comment[];
  isCommentExpended: boolean;
};
