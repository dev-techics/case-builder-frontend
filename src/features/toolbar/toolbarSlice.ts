import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Comment,
  EditorState,
  Highlight,
  PendingComment,
  PendingHighlight,
} from './types/types';

const initialState: EditorState = {
  ToolbarPosition: { x: null, y: null },
  CommentPosition: { x: null, y: null },
  pendingHighlight: null,
  pendingComment: null,
  highlights: [],
  comments: [],
  isCommentExpended: false,
};

const toolbarSlice = createSlice({
  name: 'toolbar',
  initialState,
  reducers: {
    // Toolbar position
    setToolbarPosition: (
      state,
      action: PayloadAction<{ x: number | null; y: number | null }>
    ) => {
      state.ToolbarPosition = action.payload;
    },

    // Store pending highlight (before color is selected)
    setPendingHighlight: (
      state,
      action: PayloadAction<PendingHighlight | null>
    ) => {
      state.pendingHighlight = action.payload;
    },

    // Add highlight (after color is selected)
    addHighlight: (state, action: PayloadAction<Highlight>) => {
      state.highlights.push(action.payload);
    },

    // Remove a specific highlight
    removeHighlight: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(h => h.id !== action.payload);
    },

    // Clear all highlights
    clearHighlights: state => {
      state.highlights = [];
    },

    // Clear highlights for a specific file
    clearFileHighlights: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(
        h => h.fileId !== action.payload
      );
    },

    // Clear highlights for a specific page
    clearPageHighlights: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.highlights = state.highlights.filter(
        h =>
          h.fileId !== action.payload.fileId ||
          h.pageNumber !== action.payload.pageNumber
      );
    },

    // Cancel highlight creation
    cancelHighlight: state => {
      state.ToolbarPosition = { x: null, y: null };
      state.pendingHighlight = null;
    },

    // Comment position
    setCommentPosition: (
      state,
      action: PayloadAction<{ x: number | null; y: number | null }>
    ) => {
      state.CommentPosition = action.payload;
    },

    // Set pending comment (before submission)
    setPendingComment: (
      state,
      action: PayloadAction<PendingComment | null>
    ) => {
      state.pendingComment = action.payload;
    },

    // Add comment (after submission)
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
      state.CommentPosition = { x: null, y: null };
      state.pendingComment = null;
      state.ToolbarPosition = { x: null, y: null };
    },

    // Update comment text
    updateComment: (
      state,
      action: PayloadAction<{ id: string; text: string }>
    ) => {
      const comment = state.comments.find(c => c.id === action.payload.id);
      if (comment) {
        comment.text = action.payload.text;
        comment.updatedAt = new Date().toISOString();
      }
    },

    // Delete comment
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(c => c.id !== action.payload);
    },

    // Resolve/Unresolve comment
    toggleCommentResolved: (state, action: PayloadAction<string>) => {
      const comment = state.comments.find(c => c.id === action.payload);
      if (comment) {
        comment.resolved = !comment.resolved;
      }
    },

    // Clear comments for a specific file
    clearFileComments: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(c => c.fileId !== action.payload);
    },

    // Clear comments for a specific page
    clearPageComments: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.comments = state.comments.filter(
        c =>
          c.fileId !== action.payload.fileId ||
          c.pageNumber !== action.payload.pageNumber
      );
    },

    // Cancel comment creation
    cancelCommentCreation: state => {
      state.CommentPosition = { x: null, y: null };
      state.pendingComment = null;
    },

    setIsCommentExpanded: state => {
      state.isCommentExpended = !state.isCommentExpended;
    },
  },
});

export default toolbarSlice.reducer;
export const {
  setToolbarPosition,
  setPendingHighlight,
  addHighlight,
  removeHighlight,
  clearHighlights,
  clearFileHighlights,
  clearPageHighlights,
  cancelHighlight,
  setCommentPosition,
  setPendingComment,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentResolved,
  clearFileComments,
  clearPageComments,
  cancelCommentCreation,
  setIsCommentExpanded,
} = toolbarSlice.actions;
