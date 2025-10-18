/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { CommentThread } from "./CommentThread";

export function CommentsSidebar() {
    const comments = useAppSelector((state) => state.toolbar.comments);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render if no comments exist
    if (comments.length === 0 || !mounted) {
        return null;
    }

    return (
        <div
            className="comments-sidebar pointer-events-none z-0 col-span-1 h-full bg-gray-100 pt-8"
            ref={containerRef}
        >
            <div className="pointer-events-auto relative h-full">
                {comments.map((comment) => (
                    <CommentThread comment={comment} key={comment.id} />
                ))}
            </div>
        </div>
    );
}
