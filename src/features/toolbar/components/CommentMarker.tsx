/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Comment } from "../types/SliceTypes";
import CommentCard from "./CommentCard";

// Individual comment marker component
type CommentMarkerProps = {
    comment: Comment;
    pageHeight: number;
    scale: number;
};

const CommentMarker = ({ comment, pageHeight, scale }: CommentMarkerProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Convert stored pageY (screen coordinates) to PDF percentage
    // This makes it scale-independent
    const pageNumber = comment.pageNumber;
    const pageY: number = comment.position.pageY;
    let topPercentage: number | null = null;

    if (comment.pageNumber === 1) {
        topPercentage = (pageY / pageHeight) * 100;
    } else {
        topPercentage =
            ((pageY - (pageNumber - 1) * pageHeight) / pageHeight) * 100;
    }

    // Handle click outside to close
    useEffect(() => {
        if (!isExpanded) { return; }

        const handleClickOutside = (event: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        // Add a small delay to prevent immediate closing when opening
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExpanded]);

    return (
        <>
            {/* Comment Icon/Marker - positioned at the text location */}
            <div
                className="pointer-events-auto absolute left-full z-20 ml-2"
                ref={cardRef}
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
                    type="button"
                >
                    <MessageSquare
                        className={comment.resolved ? "text-green-600" : "text-blue-600"}
                        size={16}
                    />
                </button>

                {/* Expanded Comment Card */}
                {isExpanded && (
                    <CommentCard comment={comment} onClose={() => setIsExpanded(false)} />
                )}
            </div>
        </>
    );
};

export default CommentMarker;
