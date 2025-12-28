import { Check, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  deleteCommentThunk,
  toggleCommentResolvedThunk,
  updateCommentThunk,
} from '../toolbarSlice';

type CommentCardProps = {
  comment: any;
  onClose?: () => void;
};

const CommentCard = ({ comment, onClose }: CommentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const dispatch = useAppDispatch();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) {
      return 'just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  // Handle comment update
  const handleUpdate = () => {
    if (editText.trim()) {
      dispatch(
        updateCommentThunk({ commentId: comment.id, text: editText.trim() })
      );
      setIsEditing(false);
    }
  };
  // Handle comment delete
  const handleDelete = () => {
    console.log('Deleting comment with id:', comment.id);
    dispatch(deleteCommentThunk({ commentId: comment.id }));
    onClose?.();
  };
  // Handle resolve/unresolve
  const handleResolve = () => {
    dispatch(toggleCommentResolvedThunk({ commentId: comment.id }));
  };

  return (
    <div
      className="absolute top-0 left-10 z-30 w-80 rounded-lg border-2 bg-white shadow-xl"
      style={{
        borderColor: comment.resolved ? '#86efac' : '#93c5fd',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 font-semibold text-white text-xs">
            {comment.author?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="font-medium text-gray-700 text-sm">
            {comment.author || 'User'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">
            {formatDate(comment.createdAt)}
          </span>
          <div className="relative">
            <button
              className="rounded p-1 hover:bg-gray-100"
              onClick={() => setShowMenu(!showMenu)}
              type="button"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    type="button"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      handleResolve();
                      setShowMenu(false);
                    }}
                    type="button"
                  >
                    <Check size={14} />
                    {comment.resolved ? 'Unresolve' : 'Resolve'}
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 text-sm hover:bg-red-50"
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    type="button"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            className="ml-1 rounded p-1 hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Selected text (if any) */}
      {comment.selectedText && (
        <div className="border-b bg-gray-50 p-3">
          <p className="mb-1 text-gray-500 text-xs">Selected text:</p>
          <p className="line-clamp-3 text-gray-700 text-sm italic">
            "{comment.selectedText}"
          </p>
        </div>
      )}

      {/* Comment body */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              className="min-h-[80px] w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onChange={e => setEditText(e.target.value)}
              value={editText}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <X className="mr-1" size={14} />
                Cancel
              </Button>
              <Button
                disabled={!editText.trim()}
                onClick={handleUpdate}
                size="sm"
                type="button"
              >
                <Check className="mr-1" size={14} />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-gray-700 text-sm">
            {comment.text}
          </p>
        )}
      </div>

      {/* Resolved badge */}
      {comment.resolved && (
        <div className="border-green-200 border-t bg-green-50 px-3 py-2">
          <div className="flex items-center gap-2 text-green-700">
            <Check size={14} />
            <span className="font-medium text-xs">Resolved</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentCard;
