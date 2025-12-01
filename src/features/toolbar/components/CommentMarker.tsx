import {
    Check,
    MessageSquare,
    MoreVertical,
    Pencil,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
    deleteComment,
    toggleCommentResolved,
    updateComment,
} from "../toolbarSlice";
import type { Comment } from "../types/SliceTypes";

// Individual comment marker component
type CommentMarkerProps = {
    comment: Comment;
    pageHeight: number;
    scale: number;
};

const CommentMarker = ({ comment, pageHeight, scale }: CommentMarkerProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showMenu, setShowMenu] = useState(false);
    const dispatch = useAppDispatch();

    // Convert stored pageY (screen coordinates) to PDF percentage
    // This makes it scale-independent
    const topPercentage = (comment.position.pageY / pageHeight) * 100;

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

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Comment Icon/Marker - positioned at the text location */}
            <div
                className="pointer-events-auto absolute left-full z-20 ml-2"
                style={{
                    top: `${topPercentage}%`,
                    transform: "translateY(-50%)",
                }}
            >
                {/* Connection line */}
                <div className="absolute top-1/2 right-full h-px w-2 bg-blue-400" />

                {/* Comment Icon */}
                <button
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all ${comment.resolved
                            ? "border-2 border-green-400 bg-green-100 hover:bg-green-200"
                            : "border-2 border-blue-400 bg-blue-100 hover:bg-blue-200"
                        }`}
                    onClick={() => setIsExpanded(!isExpanded)}
                    title="View comment"
                >
                    <MessageSquare
                        className={comment.resolved ? "text-green-600" : "text-blue-600"}
                        size={16}
                    />
                </button>

                {/* Expanded Comment Card */}
                {isExpanded && (
                    <div
                        className="absolute top-0 left-10 z-30 w-80 rounded-lg border-2 bg-white shadow-xl"
                        style={{
                            borderColor: comment.resolved ? "#86efac" : "#93c5fd",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b bg-gray-50 p-3">
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
                                                    {comment.resolved ? "Unresolve" : "Resolve"}
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
                                    onClick={() => setIsExpanded(false)}
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
                                        onChange={(e) => setEditText(e.target.value)}
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
                )}
            </div>
        </>
    );
};

export default CommentMarker;
