/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import { Check, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
};

export function CommentThread({ comment }: CommentThreadProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showMenu, setShowMenu] = useState(false);
    const [position, setPosition] = useState({ top: 0, visible: false });
    const commentRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    // Calculate position based on the file element in the DOM
    useEffect(() => {
        const updatePosition = () => {
            // Find the file container by data-file-id
            const fileElement = document.querySelector(
                `[data-file-id="${comment.fileId}"]`
            );

            if (!fileElement) {
                setPosition({ top: 0, visible: false });
                return;
            }

            // Find the specific page within that file
            const pageElement = fileElement.querySelector(
                `[data-page-number="${comment.pageNumber}"]`
            );

            if (!pageElement) {
                setPosition({ top: 0, visible: false });
                return;
            }

            const pageRect = pageElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Calculate absolute position from top of viewport
            // Add the stored pageY offset to get exact position within the page
            const absoluteTop = pageRect.top + comment.position.pageY;

            // Check if comment is visible in viewport (with some buffer)
            const isVisible =
                absoluteTop > -300 && absoluteTop < viewportHeight + 300;

            setPosition({
                top: absoluteTop,
                visible: isVisible,
            });
        };

        // Initial position
        updatePosition();

        // Update on scroll
        const scrollContainer = document.querySelector(".pdf-viewer-container");
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", updatePosition);
            window.addEventListener("resize", updatePosition);

            return () => {
                scrollContainer.removeEventListener("scroll", updatePosition);
                window.removeEventListener("resize", updatePosition);
            };
        }
    }, [comment.fileId, comment.pageNumber, comment.position.pageY]);

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

        if (diffMins < 1) {
            return "just now";
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

    // Don't render if not visible (performance optimization)
    if (!position.visible) {
        return null;
    }

    return (
        <div
            className={`absolute left-0 w-60 transition-all duration-200 ${comment.resolved ? "opacity-60" : ""
                }`}
            ref={commentRef}
            style={{
                top: `${position.top}px`,
            }}
        >
            {/* Connection line to the text */}
            {/* <div className="-left-32 absolute top-8 h-px w-36 bg-gray-300" /> */}

            <div
                className={`ml-4 rounded-lg border bg-white shadow-lg ${comment.resolved ? "border-green-200 bg-green-50" : "border-gray-200"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-gray-200 border-b p-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 font-semibold text-white text-xs">
                            {comment.author?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-gray-700 text-xs">
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
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
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
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
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
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 text-xs hover:bg-red-50"
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
                    </div>
                </div>

                {/* Selected text (if any) */}
                {/* {comment.selectedText && (
                    <div className="border-gray-200 border-b bg-gray-50 p-3">
                        <p className="mb-1 text-gray-500 text-xs">Selected text:</p>
                        <p className="line-clamp-3 text-gray-700 text-xs italic">
                            "{comment.selectedText}"
                        </p>
                    </div>
                )} */}

                {/* Comment body */}
                <div className="p-3">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                autoFocus
                                className="min-h-[80px] w-full resize-none rounded-md border border-gray-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onChange={(e) => setEditText(e.target.value)}
                                value={editText}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    className="text-xs"
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
                                    className="text-xs"
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
                        <p className="whitespace-pre-wrap text-gray-700 text-xs">
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
