/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { useEffect, useRef } from "react";
import { useAppSelector } from "@/app/hooks";
import { CommentThread } from "./CommentThread";

type CommentsSidebarProps = {
    fileId: string; // Current file being viewed
    pageNumber?: number; // Optional: if you want to filter by page
};

export function CommentsSidebar({ fileId, pageNumber }: CommentsSidebarProps) {
    const comments = useAppSelector((state) => state.toolbar.comments);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollOffsetRef = useRef(0);

    // Filter comments for current file and optionally current page
    const filteredComments = comments.filter(
        (comment) =>
            comment.fileId === fileId &&
            (pageNumber === undefined || comment.pageNumber === pageNumber)
    );

    // Listen to scroll events on the document viewer
    useEffect(() => {
        const handleScroll = () => {
            // Get the scroll container (adjust selector to match your app)
            const scrollContainer = document.querySelector(".pdf-viewer-container");
            if (scrollContainer) {
                scrollOffsetRef.current = scrollContainer.scrollTop;
                // Force re-render to update comment positions
                if (containerRef.current) {
                    containerRef.current.style.transform = `translateY(${scrollOffsetRef.current}px)`;
                }
            }
        };

        const scrollContainer = document.querySelector(".pdf-viewer-container");
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll);
            return () => {
                scrollContainer.removeEventListener("scroll", handleScroll);
            };
        }
    }, []);

    if (filteredComments.length === 0) {
        return null;
    }

    return (
        <div
            className="pointer-events-none absolute top-0 right-0 h-full"
            ref={containerRef}
            style={{ width: "400px" }}
        >
            <div className="pointer-events-auto relative h-full">
                {filteredComments.map((comment) => (
                    <CommentThread
                        comment={comment}
                        key={comment.id}
                        scrollOffset={scrollOffsetRef.current}
                    />
                ))}
            </div>
        </div>
    );
}
