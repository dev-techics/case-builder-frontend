import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type {
  AnnotationTool,
  Comment,
  CreateCommentRequest,
  CommentApiResponse,
  EditorState,
  Highlight,
  CreateHighlightRequest,
  HighlightApiResponse,
  PendingComment,
  PendingHighlight,
  Redaction,
  RedactionStyle,
  CreateRedactionRequest,
  RedactionApiResponse,
} from '@/features/toolbar/types/types';
import axiosInstance from '@/api/axiosInstance';
import { redactionsApi } from '@/features/toolbar/api/redactionsApi';

const initialState: EditorState = {
  activeTool: 'select',
  redactionStyle: {
    name: 'Black',
    fillHex: '#000000',
    opacity: 1,
    borderHex: '#000000',
    borderWidth: 2,
  },
  ToolbarPosition: { x: null, y: null },
  CommentPosition: { x: null, y: null },
  pendingHighlight: null,
  pendingComment: null,
  highlights: [],
  redactions: [],
  comments: [],
  isCommentExpended: false,
  // Highlights loading states
  loadingHighlights: false,
  highlightError: null,
  // Redactions loading states
  loadingRedactions: false,
  redactionError: null,
  // Comments loading states
  loadingComments: false,
  commentError: null,
};

/*=============================================
=            Async Thunks - Comments          =
=============================================*/

/**
 * Load all comments for a bundle
 */
export const loadComments = createAsyncThunk<
  Comment[],
  { bundleId: string },
  { rejectValue: string }
>('toolbar/loadComments', async ({ bundleId }, { rejectWithValue }) => {
  try {
    console.log('Loading comments for bundle:', bundleId);
    const response = await axiosInstance.get(
      `/api/bundles/${bundleId}/comments`
    );

    // Transform API response to match frontend Comment type
    const comments: Comment[] = response.data.comments.map(
      (c: CommentApiResponse) => ({
        id: String(c.id),
        fileId: String(c.document_id),
        pageNumber: c.page_number,
        text: c.text,
        selectedText: c.selected_text,
        position: {
          x: c.x,
          y: c.y,
          pageY: c.page_y,
        },
        resolved: c.resolved,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author: c.user?.name,
      })
    );

    return comments;
  } catch (err: any) {
    console.error('Failed to load comments:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to load comments';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Create a new comment
 */
export const createComment = createAsyncThunk<
  Comment,
  { bundleId: string; data: CreateCommentRequest },
  { rejectValue: string }
>('toolbar/createComment', async ({ bundleId, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      `/api/bundles/${bundleId}/comments`,
      data
    );

    const c: CommentApiResponse = response.data.comment;

    // Transform to frontend format
    const comment: Comment = {
      id: String(c.id),
      fileId: String(c.document_id),
      pageNumber: c.page_number,
      text: c.text,
      selectedText: c.selected_text,
      position: {
        x: c.x,
        y: c.y,
        pageY: c.page_y,
      },
      resolved: c.resolved,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      author: c.user?.name,
    };

    console.log('✅ Comment created:', comment);
    return comment;
  } catch (err: any) {
    console.error('Failed to create comment:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to create comment';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Update comment text
 */
export const updateCommentThunk = createAsyncThunk<
  Comment,
  { commentId: string; text: string },
  { rejectValue: string }
>('toolbar/updateComment', async ({ commentId, text }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/api/comments/${commentId}`, {
      text,
    });

    const c: CommentApiResponse = response.data.comment;

    const comment: Comment = {
      id: String(c.id),
      fileId: String(c.document_id),
      pageNumber: c.page_number,
      text: c.text,
      selectedText: c.selected_text,
      position: {
        x: c.x,
        y: c.y,
        pageY: c.page_y,
      },
      resolved: c.resolved,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      author: c.user?.name,
    };

    console.log('✅ Comment updated:', comment);
    return comment;
  } catch (err: any) {
    console.error('Failed to update comment:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to update comment';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Toggle comment resolved status
 */
export const toggleCommentResolvedThunk = createAsyncThunk<
  Comment,
  { commentId: string },
  { rejectValue: string }
>(
  'toolbar/toggleCommentResolved',
  async ({ commentId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/api/comments/${commentId}/toggle-resolved`
      );

      const c: CommentApiResponse = response.data.comment;

      const comment: Comment = {
        id: String(c.id),
        fileId: String(c.document_id),
        pageNumber: c.page_number,
        text: c.text,
        selectedText: c.selected_text,
        position: {
          x: c.x,
          y: c.y,
          pageY: c.page_y,
        },
        resolved: c.resolved,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author: c.user?.name,
      };

      console.log('✅ Comment resolved status toggled:', comment);
      return comment;
    } catch (err: any) {
      console.error('Failed to toggle comment resolved:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to toggle comment';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete a comment
 */
export const deleteCommentThunk = createAsyncThunk<
  string,
  { commentId: string },
  { rejectValue: string }
>('toolbar/deleteComment', async ({ commentId }, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/comments/${commentId}`);
    console.log('✅ Comment deleted:', commentId);
    return commentId;
  } catch (err: any) {
    console.error('Failed to delete comment:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to delete comment';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Bulk delete comments
 */
export const bulkDeleteComments = createAsyncThunk<
  string[],
  { bundleId: string; commentIds: string[] },
  { rejectValue: string }
>(
  'toolbar/bulkDeleteComments',
  async ({ bundleId, commentIds }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(
        `/api/bundles/${bundleId}/comments/bulk-delete`,
        {
          comment_ids: commentIds.map(id => parseInt(id)),
        }
      );
      console.log('✅ Bulk deleted comments:', commentIds);
      return commentIds;
    } catch (err: any) {
      console.error('Failed to bulk delete comments:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete comments';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Clear all comments for a document
 */
export const clearDocumentComments = createAsyncThunk<
  string,
  { documentId: string },
  { rejectValue: string }
>(
  'toolbar/clearDocumentComments',
  async ({ documentId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/documents/${documentId}/comments`);
      console.log('✅ Cleared all comments for document:', documentId);
      return documentId;
    } catch (err: any) {
      console.error('Failed to clear document comments:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to clear comments';
      return rejectWithValue(errorMessage);
    }
  }
);

/*=============================================
=            Async Thunks                     =
=============================================*/

/**
 * Load all highlights for a bundle
 */
export const loadHighlights = createAsyncThunk<
  Highlight[],
  { bundleId: string },
  { rejectValue: string }
>('toolbar/loadHighlights', async ({ bundleId }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      `/api/bundles/${bundleId}/highlights`
    );

    // Transform API response to match frontend Highlight type
    const highlights: Highlight[] = response.data.highlights.map(
      (h: HighlightApiResponse) => ({
        id: String(h.id),
        fileId: String(h.document_id),
        pageNumber: h.page_number,
        coordinates: {
          x: h.x,
          y: h.y,
          width: h.width,
          height: h.height,
        },
        text: h.text,
        color: {
          name: h.color_name,
          hex: h.color_hex,
          rgb: h.color_rgb,
          opacity: h.opacity,
        },
        createdAt: h.created_at,
      })
    );

    return highlights;
  } catch (err: any) {
    console.error('Failed to load highlights:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to load highlights';
    return rejectWithValue(errorMessage);
  }
});

const mapRedactionFromApi = (r: RedactionApiResponse): Redaction => ({
  id: String(r.id),
  fileId: String(r.document_id),
  pageNumber: r.page_number,
  coordinates: {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
  },
  style: {
    name: r.name || 'Custom',
    fillHex: r.opacity === 0 ? null : r.fill_hex,
    opacity: r.opacity ?? 1,
    borderHex: r.border_hex || '#000000',
    borderWidth: r.border_width ?? 2,
  },
  createdAt: r.created_at,
});

/*=============================================
=            Async Thunks - Redactions        =
=============================================*/

/**
 * Load all redactions for a bundle
 */
export const loadRedactions = createAsyncThunk<
  Redaction[],
  { bundleId: string },
  { rejectValue: string }
>('toolbar/loadRedactions', async ({ bundleId }, { rejectWithValue }) => {
  try {
    const redactions = await redactionsApi.fetchRedactions(bundleId);
    return redactions.map(mapRedactionFromApi);
  } catch (err: any) {
    console.error('Failed to load redactions:', err);
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Failed to load redactions';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Create a new redaction
 */
export const createRedaction = createAsyncThunk<
  Redaction,
  { bundleId: string; data: CreateRedactionRequest },
  { rejectValue: string }
>('toolbar/createRedaction', async ({ bundleId, data }, { rejectWithValue }) => {
  try {
    const redaction = await redactionsApi.createRedaction(bundleId, data);
    return mapRedactionFromApi(redaction);
  } catch (err: any) {
    console.error('Failed to create redaction:', err);
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Failed to create redaction';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Delete a redaction
 */
export const deleteRedaction = createAsyncThunk<
  string,
  { redactionId: string },
  { rejectValue: string }
>(
  'toolbar/deleteRedaction',
  async ({ redactionId }, { rejectWithValue }) => {
    try {
      await redactionsApi.deleteRedaction(redactionId);
      return redactionId;
    } catch (err: any) {
      console.error('Failed to delete redaction:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete redaction';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Create a new highlight
 */
export const createHighlight = createAsyncThunk<
  Highlight,
  { bundleId: string; data: CreateHighlightRequest },
  { rejectValue: string }
>(
  'toolbar/createHighlight',
  async ({ bundleId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/api/bundles/${bundleId}/highlights`,
        data
      );

      const h: HighlightApiResponse = response.data.highlight;

      // Transform to frontend format
      const highlight: Highlight = {
        id: String(h.id),
        fileId: String(h.document_id),
        pageNumber: h.page_number,
        coordinates: {
          x: h.x,
          y: h.y,
          width: h.width,
          height: h.height,
        },
        text: h.text,
        color: {
          name: h.color_name,
          rgb: h.color_rgb,
          hex: h.color_hex,
          opacity: h.opacity,
        },
        createdAt: h.created_at,
      };

      console.log('✅ Highlight created:', highlight);
      return highlight;
    } catch (err: any) {
      console.error('Failed to create highlight:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to create highlight';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete a highlight
 */
export const deleteHighlight = createAsyncThunk<
  string,
  { highlightId: string },
  { rejectValue: string }
>('toolbar/deleteHighlight', async ({ highlightId }, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/api/highlights/${highlightId}`);
    console.log('✅ Highlight deleted:', highlightId);
    return highlightId;
  } catch (err: any) {
    console.error('Failed to delete highlight:', err);
    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      'Failed to delete highlight';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Update highlight color
 */
export const updateHighlightColor = createAsyncThunk<
  Highlight,
  {
    highlightId: string;
    color: {
      color_name: string;
      color_hex: string;
      color_rgb: { r: number; g: number; b: number };
      opacity?: number;
    };
  },
  { rejectValue: string }
>(
  'toolbar/updateHighlightColor',
  async ({ highlightId, color }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/api/highlights/${highlightId}`,
        color
      );

      const h: HighlightApiResponse = response.data.highlight;

      const highlight: Highlight = {
        id: String(h.id),
        fileId: String(h.document_id),
        pageNumber: h.page_number,
        coordinates: {
          x: h.x,
          y: h.y,
          width: h.width,
          height: h.height,
        },
        text: h.text,
        color: {
          name: h.color_name,
          hex: h.color_hex,
          rgb: h.color_rgb,
          opacity: h.opacity,
        },
        createdAt: h.created_at,
      };

      console.log('✅ Highlight color updated:', highlight);
      return highlight;
    } catch (err: any) {
      console.error('Failed to update highlight color:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to update highlight';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Bulk delete highlights
 */
export const bulkDeleteHighlights = createAsyncThunk<
  string[],
  { bundleId: string; highlightIds: string[] },
  { rejectValue: string }
>(
  'toolbar/bulkDeleteHighlights',
  async ({ bundleId, highlightIds }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(
        `/api/bundles/${bundleId}/highlights/bulk-delete`,
        {
          highlight_ids: highlightIds.map(id => parseInt(id)),
        }
      );
      console.log('✅ Bulk deleted highlights:', highlightIds);
      return highlightIds;
    } catch (err: any) {
      console.error('Failed to bulk delete highlights:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete highlights';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Clear all highlights for a document
 */
export const clearDocumentHighlights = createAsyncThunk<
  string,
  { documentId: string },
  { rejectValue: string }
>(
  'toolbar/clearDocumentHighlights',
  async ({ documentId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/documents/${documentId}/highlights`);
      console.log('✅ Cleared all highlights for document:', documentId);
      return documentId;
    } catch (err: any) {
      console.error('Failed to clear document highlights:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to clear highlights';
      return rejectWithValue(errorMessage);
    }
  }
);

/*=============================================
=            Redux Slice                      =
=============================================*/

const toolbarSlice = createSlice({
  name: 'toolbar',
  initialState,
  reducers: {
    // Active annotation tool
    setActiveTool: (state, action: PayloadAction<AnnotationTool>) => {
      state.activeTool = action.payload;
    },

    setRedactionStyle: (state, action: PayloadAction<RedactionStyle>) => {
      state.redactionStyle = action.payload;
    },

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

    // Add highlight (local only - use createHighlight thunk for API)
    addHighlight: (state, action: PayloadAction<Highlight>) => {
      state.highlights.push(action.payload);
    },

    // Remove a specific highlight (local only - use deleteHighlight thunk for API)
    removeHighlight: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(h => h.id !== action.payload);
    },

    // Clear all highlights
    clearHighlights: state => {
      state.highlights = [];
    },

    // Clear highlights for a specific file (local only)
    clearFileHighlights: (state, action: PayloadAction<string>) => {
      state.highlights = state.highlights.filter(
        h => h.fileId !== action.payload
      );
    },

    // Clear highlights for a specific page (local only)
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

    // Redactions
    addRedaction: (state, action: PayloadAction<Redaction>) => {
      state.redactions.push(action.payload);
    },

    removeRedaction: (state, action: PayloadAction<string>) => {
      state.redactions = state.redactions.filter(
        r => r.id !== action.payload
      );
    },

    clearRedactions: state => {
      state.redactions = [];
    },

    clearFileRedactions: (state, action: PayloadAction<string>) => {
      state.redactions = state.redactions.filter(
        r => r.fileId !== action.payload
      );
    },

    clearPageRedactions: (
      state,
      action: PayloadAction<{ fileId: string; pageNumber: number }>
    ) => {
      state.redactions = state.redactions.filter(
        r =>
          r.fileId !== action.payload.fileId ||
          r.pageNumber !== action.payload.pageNumber
      );
    },

    // Clear error
    clearHighlightError: state => {
      state.highlightError = null;
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

  extraReducers: builder => {
    /*-------------------
      Load Highlights
    -------------------*/
    builder
      .addCase(loadHighlights.pending, state => {
        state.loadingHighlights = true;
        state.highlightError = null;
      })
      .addCase(loadHighlights.fulfilled, (state, action) => {
        state.loadingHighlights = false;
        state.highlights = action.payload;
      })
      .addCase(loadHighlights.rejected, (state, action) => {
        state.loadingHighlights = false;
        state.highlightError = action.payload || 'Failed to load highlights';
      });

    /*-------------------
      Create Highlight
    -------------------*/
    builder
      .addCase(createHighlight.pending, state => {
        state.highlightError = null;
      })
      .addCase(createHighlight.fulfilled, (state, action) => {
        state.highlights.push(action.payload);
        // Clear pending highlight after creation
        state.pendingHighlight = null;
        state.ToolbarPosition = { x: null, y: null };
      })
      .addCase(createHighlight.rejected, (state, action) => {
        state.highlightError = action.payload || 'Failed to create highlight';
      });

    /*-------------------
      Delete Highlight
    -------------------*/
    builder
      .addCase(deleteHighlight.pending, state => {
        state.highlightError = null;
      })
      .addCase(deleteHighlight.fulfilled, (state, action) => {
        state.highlights = state.highlights.filter(
          h => h.id !== action.payload
        );
      })
      .addCase(deleteHighlight.rejected, (state, action) => {
        state.highlightError = action.payload || 'Failed to delete highlight';
      });

    /*-------------------
      Update Highlight Color
    -------------------*/
    builder
      .addCase(updateHighlightColor.pending, state => {
        state.highlightError = null;
      })
      .addCase(updateHighlightColor.fulfilled, (state, action) => {
        const index = state.highlights.findIndex(
          h => h.id === action.payload.id
        );
        if (index !== -1) {
          state.highlights[index] = action.payload;
        }
      })
      .addCase(updateHighlightColor.rejected, (state, action) => {
        state.highlightError = action.payload || 'Failed to update highlight';
      });

    /*-------------------
      Load Redactions
    -------------------*/
    builder
      .addCase(loadRedactions.pending, state => {
        state.loadingRedactions = true;
        state.redactionError = null;
      })
      .addCase(loadRedactions.fulfilled, (state, action) => {
        state.loadingRedactions = false;
        state.redactions = action.payload;
      })
      .addCase(loadRedactions.rejected, (state, action) => {
        state.loadingRedactions = false;
        state.redactionError = action.payload || 'Failed to load redactions';
      });

    /*-------------------
      Create Redaction
    -------------------*/
    builder
      .addCase(createRedaction.pending, state => {
        state.redactionError = null;
      })
      .addCase(createRedaction.fulfilled, (state, action) => {
        state.redactions.push(action.payload);
      })
      .addCase(createRedaction.rejected, (state, action) => {
        state.redactionError = action.payload || 'Failed to create redaction';
      });

    /*-------------------
      Delete Redaction
    -------------------*/
    builder
      .addCase(deleteRedaction.pending, state => {
        state.redactionError = null;
      })
      .addCase(deleteRedaction.fulfilled, (state, action) => {
        state.redactions = state.redactions.filter(
          r => r.id !== action.payload
        );
      })
      .addCase(deleteRedaction.rejected, (state, action) => {
        state.redactionError = action.payload || 'Failed to delete redaction';
      });

    /*-------------------
      Bulk Delete Highlights
    -------------------*/
    builder
      .addCase(bulkDeleteHighlights.fulfilled, (state, action) => {
        state.highlights = state.highlights.filter(
          h => !action.payload.includes(h.id)
        );
      })
      .addCase(bulkDeleteHighlights.rejected, (state, action) => {
        state.highlightError = action.payload || 'Failed to delete highlights';
      });

    /*-------------------
      Clear Document Highlights
    -------------------*/
    builder
      .addCase(clearDocumentHighlights.fulfilled, (state, action) => {
        state.highlights = state.highlights.filter(
          h => h.fileId !== action.payload
        );
      })
      .addCase(clearDocumentHighlights.rejected, (state, action) => {
        state.highlightError = action.payload || 'Failed to clear highlights';
      });

    /*-------------------
      Load Comments
    -------------------*/
    builder
      .addCase(loadComments.pending, state => {
        state.loadingComments = true;
        state.commentError = null;
      })
      .addCase(loadComments.fulfilled, (state, action) => {
        state.loadingComments = false;
        state.comments = action.payload;
      })
      .addCase(loadComments.rejected, (state, action) => {
        state.loadingComments = false;
        state.commentError = action.payload || 'Failed to load comments';
      });

    /*-------------------
      Create Comment
    -------------------*/
    builder
      .addCase(createComment.pending, state => {
        state.commentError = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
        // Clear pending comment after creation
        state.pendingComment = null;
        state.CommentPosition = { x: null, y: null };
        state.ToolbarPosition = { x: null, y: null };
      })
      .addCase(createComment.rejected, (state, action) => {
        state.commentError = action.payload || 'Failed to create comment';
      });

    /*-------------------
      Update Comment
    -------------------*/
    builder
      .addCase(updateCommentThunk.pending, state => {
        state.commentError = null;
      })
      .addCase(updateCommentThunk.fulfilled, (state, action) => {
        const index = state.comments.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(updateCommentThunk.rejected, (state, action) => {
        state.commentError = action.payload || 'Failed to update comment';
      });

    /*-------------------
      Toggle Comment Resolved
    -------------------*/
    builder
      .addCase(toggleCommentResolvedThunk.fulfilled, (state, action) => {
        const index = state.comments.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(toggleCommentResolvedThunk.rejected, (state, action) => {
        state.commentError = action.payload || 'Failed to toggle comment';
      });

    /*-------------------
      Delete Comment
    -------------------*/
    builder
      .addCase(deleteCommentThunk.pending, state => {
        state.commentError = null;
      })
      .addCase(deleteCommentThunk.fulfilled, (state, action) => {
        state.comments = state.comments.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCommentThunk.rejected, (state, action) => {
        state.commentError = action.payload || 'Failed to delete comment';
      });

    /*-------------------
      Bulk Delete Comments
    -------------------*/
    builder
      .addCase(bulkDeleteComments.fulfilled, (state, action) => {
        state.comments = state.comments.filter(
          c => !action.payload.includes(c.id)
        );
      })
      .addCase(bulkDeleteComments.rejected, (state, action) => {
        state.commentError = action.payload || 'Failed to delete comments';
      });

    /*-------------------
      Clear Document Comments
    -------------------*/
    builder
      .addCase(clearDocumentComments.fulfilled, (state, action) => {
        state.comments = state.comments.filter(
          c => c.fileId !== action.payload
        );
      })
      .addCase(clearDocumentComments.rejected, (state, action) => {
        state.commentError = action.payload || 'Failed to clear comments';
      });
  },
});

export default toolbarSlice.reducer;

export const {
  setActiveTool,
  setRedactionStyle,
  setToolbarPosition,
  setPendingHighlight,
  addHighlight,
  removeHighlight,
  clearHighlights,
  clearFileHighlights,
  clearPageHighlights,
  cancelHighlight,
  addRedaction,
  removeRedaction,
  clearRedactions,
  clearFileRedactions,
  clearPageRedactions,
  clearHighlightError,
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

/*=============================================
=            Selectors                        =
=============================================*/

export const selectHighlights = (state: { toolbar: EditorState }) =>
  state.toolbar.highlights;
export const selectLoadingHighlights = (state: { toolbar: EditorState }) =>
  state.toolbar.loadingHighlights;
export const selectHighlightError = (state: { toolbar: EditorState }) =>
  state.toolbar.highlightError;
export const selectHighlightsByDocument = (
  state: { toolbar: EditorState },
  documentId: string
) => state.toolbar.highlights.filter(h => h.fileId === documentId);
export const selectHighlightsByPage = (
  state: { toolbar: EditorState },
  documentId: string,
  pageNumber: number
) =>
  state.toolbar.highlights.filter(
    h => h.fileId === documentId && h.pageNumber === pageNumber
  );
