// src/features/toolbar/types/types.ts

// Highlight color object
export type HighlightColor = {
  name: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
  opacity: number;
};

// Highlight object
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
  createdAt?: string | number; // Optional: timestamp
};

export type AnnotationTool =
  | 'select'
  | 'highlight'
  | 'comment'
  | 'redact'
  | 'draw';

export type RedactionStyle = {
  name: string;
  fillHex: string | null;
  opacity: number;
  borderHex: string;
  borderWidth: number;
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

export type Redaction = {
  id: string;
  fileId: string;
  pageNumber: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: RedactionStyle;
  createdAt?: string | number;
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
  activeTool: AnnotationTool;
  redactionStyle: RedactionStyle;
  ToolbarPosition: { x: number | null; y: number | null };
  CommentPosition: { x: number | null; y: number | null };
  pendingHighlight: PendingHighlight | null;
  pendingComment: PendingComment | null;
  highlights: Highlight[]; // Array to store multiple highlights
  redactions: Redaction[];
  comments: Comment[];
  isCommentExpended: boolean;

  // Loading states for async operations
  loadingHighlights?: boolean;
  highlightError?: string | null;
  loadingRedactions?: boolean;
  redactionError?: string | null;

  // Comments loading states
  loadingComments?: boolean;
  commentError?: string | null;
};

export interface CreateHighlightRequest {
  document_id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color_name: string;
  color_hex: string;
  color_rgb: {
    r: number;
    g: number;
    b: number;
  };
  opacity: number;
}

export interface HighlightApiResponse {
  id: number;
  bundle_id: number;
  document_id: number;
  user_id: number;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color_name: string;
  color_hex: string;
  color_rgb: {
    r: number;
    g: number;
    b: number;
  };
  opacity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  document_id: string;
  page_number: number;
  text: string;
  selected_text?: string;
  x: number;
  y: number;
  page_y: number;
}

export interface CreateRedactionRequest {
  document_id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fill_hex: string;
  opacity: number;
  border_hex: string;
  border_width: number;
}

export interface RedactionApiResponse {
  id: number;
  bundle_id: number;
  document_id: number;
  user_id: number;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fill_hex: string;
  opacity: number;
  border_hex: string;
  border_width: number;
  created_at: string;
  updated_at: string;
}

export interface CommentApiResponse {
  id: number;
  bundle_id: number;
  document_id: number;
  user_id: number;
  page_number: number;
  text: string;
  selected_text?: string;
  x: number;
  y: number;
  page_y: number;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
}
