import { ArrowUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  cancelCommentCreation,
  cancelHighlight,
  createComment,
} from '@/features/toolbar/redux';
import type { CreateCommentRequest } from '../types/types';

type InputCommentProps = {
  variant?: 'toolbar' | 'floating';
};

function InputComment({ variant = 'toolbar' }: InputCommentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const justOpenedRef = useRef(false); // Track if just opened
  const bundleId = useAppSelector(states => states.fileTree.tree.id);
  //   const toolbarPosition = useAppSelector(
  //     states => states.toolbar.ToolbarPosition
  //   );

  const CommentPosition = useAppSelector(
    states => states.toolbar.CommentPosition
  );
  const pendingComment = useAppSelector(
    states => states.toolbar.pendingComment
  );
  const dispatch = useAppDispatch();

  // Show/hide based on position
  useEffect(() => {
    const shouldShow =
      variant === 'floating'
        ? CommentPosition &&
          CommentPosition.x !== null &&
          CommentPosition.y !== null
        : Boolean(pendingComment);

    if (shouldShow) {
      setIsVisible(true);
      justOpenedRef.current = true; // Mark as just opened

      // Focus input when visible
      setTimeout(() => {
        inputRef.current?.focus();
        // Allow click-outside handler to work after a delay
        setTimeout(() => {
          justOpenedRef.current = false;
        }, 100);
      }, 0);
    } else {
      setIsVisible(false);
      setCommentText('');
    }
  }, [CommentPosition, pendingComment, variant]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if just opened
      if (justOpenedRef.current) {
        return;
      }

      const target = e.target as HTMLElement;

      // Don't close if clicking inside comment input
      if (target.closest('.comment-input')) {
        return;
      }

      // Don't close if clicking on the toolbar
      if (
        target.closest('.annotation-toolbar') ||
        target.closest('.highlight-color-picker')
      ) {
        return;
      }

      // Close the comment input
      dispatch(cancelCommentCreation());
    };

    if (isVisible) {
      // Add listener with a small delay to avoid immediate triggering
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 150);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && pendingComment) {
      // Create the comment
      const comment: CreateCommentRequest = {
        document_id: pendingComment.fileId,
        page_number: pendingComment.pageNumber,
        text: commentText.trim(),
        selected_text: pendingComment.selectedText,
        x: pendingComment.position.x,
        y: pendingComment.position.y,
        page_y: pendingComment.position.pageY,
      };

      console.log('✅ Comment created:', comment);
      dispatch(
        createComment({ bundleId: bundleId.split('-')[1], data: comment })
      );

      // Clear text selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }

      // Close both comment input and toolbar
      dispatch(cancelCommentCreation());
      dispatch(cancelHighlight());

      // Reset form
      setCommentText('');
    }
  };
  // console.log("comment input position-y: ", toolbarPosition.y)
  const handleCancel = () => {
    dispatch(cancelCommentCreation());
    setCommentText('');

    // Don't clear text selection on cancel
    // User might want to try highlighting instead
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  if (variant === 'floating') {
    if (
      !(CommentPosition && isVisible) ||
      CommentPosition.x === null ||
      CommentPosition.y === null
    ) {
      return null;
    }

    return (
      <div
        className="comment-input absolute z-50 w-80 rounded-lg border border-gray-200 bg-white shadow-xl"
        style={{
          right: `${-350}px`,
          top: `${CommentPosition.y}px`,
        }}
      >
        <form
          className="relative flex items-start gap-2 p-3"
          onSubmit={handleSubmit}
        >
          <textarea
            className="min-h-[40px] flex-1 resize-none overflow-hidden rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            ref={inputRef}
            value={commentText}
          />
          <div className="flex flex-col gap-2">
            <Button
              className="h-6 w-6 rounded-full"
              disabled={!commentText.trim()}
              size="icon"
              title="Submit comment"
              type="submit"
            >
              <ArrowUp size={16} />
            </Button>
            <Button
              className="h-6 w-6 rounded-full"
              onClick={handleCancel}
              size="icon"
              title="Cancel"
              type="button"
              variant="outline"
            >
              <X size={16} />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="comment-input w-full border-gray-200 border-t bg-white px-4 py-3">
      {/* Show selected text preview */}
      {/* {pendingComment?.selectedText && (
                <div className="border-gray-200 border-b bg-gray-50 p-3">
                    <p className="mb-1 text-gray-500 text-xs">Selected text:</p>
                    <p className="line-clamp-2 text-gray-700 text-sm italic">
                        "{pendingComment.selectedText}"
                    </p>
                </div>
            )} */}

      {/* Comment form */}
      <form className="flex items-start gap-2" onSubmit={handleSubmit}>
        <textarea
          className="min-h-[40px] flex-1 resize-none overflow-hidden rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onChange={e => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          ref={inputRef}
          value={commentText}
        />
        <div className="flex flex-col gap-2">
          {/* Submit button */}
          <Button
            className="h-6 w-6 rounded-full"
            disabled={!commentText.trim()}
            size="icon"
            title="Submit comment"
            type="submit"
          >
            <ArrowUp size={16} />
          </Button>
          {/* Cancel button */}
          <Button
            className="h-6 w-6 rounded-full"
            onClick={handleCancel}
            size="icon"
            title="Cancel"
            type="button"
            variant="outline"
          >
            <X size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default InputComment;
