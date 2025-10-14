/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
    addComment,
    cancelCommentCreation,
    cancelHighlight,
} from "@/features/toolbar/toolbarSlice";

function InputComment() {
    const [isVisible, setIsVisible] = useState(false);
    const [commentText, setCommentText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const CommentPosition = useAppSelector(
        (states) => states.toolbar.CommentPosition
    );
    const pendingComment = useAppSelector(
        (states) => states.toolbar.pendingComment
    );
    const dispatch = useAppDispatch();

    // Show/hide based on position
    useEffect(() => {
        if (
            CommentPosition &&
            CommentPosition.x !== null &&
            CommentPosition.y !== null
        ) {
            setIsVisible(true);
            // Focus input when visible
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setIsVisible(false);
            setCommentText("");
        }
    }, [CommentPosition]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Close if clicking outside the comment input
            if (!target.closest(".comment-input")) {
                dispatch(cancelCommentCreation());
            }
        };

        if (isVisible) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isVisible, dispatch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim() && pendingComment) {
            // Create the comment
            const comment = {
                id: `comment-${Date.now()}-${Math.random()}`,
                fileId: pendingComment.fileId,
                pageNumber: pendingComment.pageNumber,
                text: commentText.trim(),
                selectedText: pendingComment.selectedText,
                position: pendingComment.position,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                resolved: false,
            };
            console.log(comment);
            dispatch(addComment(comment));

            // Clear text selection
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
            }

            // Close the toolbar
            dispatch(cancelHighlight());
        }
    };

    const handleCancel = () => {
        dispatch(cancelCommentCreation());
        setCommentText("");
    };

    // Don't render if no position or not visible
    if (
        !(CommentPosition && isVisible) ||
        CommentPosition.x === null ||
        CommentPosition.y === null
    ) {
        return null;
    }

    return (
        <div
            className="comment-input fixed z-50 w-80 rounded-lg border border-gray-200 bg-white shadow-xl"
            style={{
                right: `${CommentPosition.x}px`,
                top: `${CommentPosition.y}px`,
            }}
        >
            {pendingComment?.selectedText && (
                <div className="border-gray-200 border-b bg-gray-50 p-3">
                    <p className="mb-1 text-gray-500 text-xs">Selected text:</p>
                    <p className="line-clamp-2 text-gray-700 text-sm italic">
                        "{pendingComment.selectedText}"
                    </p>
                </div>
            )}
            <form
                className="relative flex items-start gap-2 p-3"
                onSubmit={handleSubmit}
            >
                <textarea
                    className="min-h-[80px] flex-1 resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    ref={inputRef as any}
                    value={commentText}
                />
                <div className="flex flex-col gap-2">
                    <Button
                        className="h-8 w-8 rounded-full"
                        disabled={!commentText.trim()}
                        size="icon"
                        title="Submit comment"
                        type="submit"
                    >
                        <ArrowUp size={16} />
                    </Button>
                    <Button
                        className="h-8 w-8 rounded-full"
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
