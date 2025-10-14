/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import { Check, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
    deleteComment,
    toggleCommentResolved,
    updateComment,
} from "@/features/toolbar/toolbarSlice";
import type { Comment } from "@/features/toolbar/types/SliceTypes";

type CommentThreadProps = {
    comment: Comment;
    scrollOffset: number; // Current scroll position of the page container
};

export function CommentThread({ comment, scrollOffset }: CommentThreadProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showMenu, setShowMenu] = useState(false);
    const dispatch = useAppDispatch();

    // Calculate position accounting for scroll
    const adjustedY = comment.position.pageY - scrollOffset;

    const handleUpdate = () => {
        if (editText.trim()) {
            dispatch(updateComment({ id: comment.id, text: editText.trim() }));
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        dispatch(deleteComment(comment.id));
    };

    const handleResolve = () => {
        dispatch(toggleCommentResolved(comment.id));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60_000);
        const diffHours = Math.floor(diffMs / 3_600_000);
        const diffDays = Math.floor(diffMs / 86_400_000);

        if (diffMins < 1) { return "just now"; }
        if (diffMins < 60) { return `${diffMins}m ago`; }
        if (diffHours < 24) { return `${diffHours}h ago`; }
        if (diffDays < 7) { return `${diffDays}d ago`; }
        return date.toLocaleDateString();
    };

    return (
        <div
            className={`absolute right-4 w-80 transition-all duration-200 ${comment.resolved ? "opacity-60" : ""
                }`}
            style={{
                top: `${adjustedY}px`,
            }}
        >
            {/* Connection line to the text */}
            <div className="absolute top-3 left-0 h-px w-4 bg-gray-300" />

            <div
                className={`ml-4 rounded-lg border bg-white shadow-lg ${comment.resolved ? "border-green-200 bg-green-50" : "border-gray-200"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-gray-200 border-b p-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 font-semibold text-white text-xs">
                            {comment.author?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-gray-700 text-sm">
                            {comment.author || "User"}
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
                                <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                                    {/* Edit button */}
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
                                    {/* Resolve/Unresolve button */}
                                    <button
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                        onClick={() => {
                                            handleResolve();
                                            setShowMenu(false);
                                        }}
                                        type="button"
                                    >
                                        <Check size={14} />
                                        {comment.resolved ? "Unresolve" : "Resolve"}
                                    </button>
                                    {/* Delete button */}
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
                            )}
                        </div>
                    </div>
                </div>

                {/* Selected text (if any) */}
                {comment.selectedText && (
                    <div className="border-gray-200 border-b bg-gray-50 p-3">
                        <p className="mb-1 text-gray-500 text-xs">Selected text:</p>
                        <p className="text-gray-700 text-sm italic">
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
                                onChange={(e) => setEditText(e.target.value)}
                                value={editText}
                            />
                            <div className="flex justify-end gap-2">
                                {/* Cancel Button */}
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
                                {/* Save Button */}
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
        </div>
    );
}
