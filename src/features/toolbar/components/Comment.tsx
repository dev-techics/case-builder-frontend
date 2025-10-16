/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <explanation> */
/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { MessageSquareText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setCommentPosition, setPendingComment } from "../toolbarSlice";

function Comment() {
    const dispatch = useAppDispatch();
    const position = useAppSelector((state) => state.toolbar.ToolbarPosition); // Toolbar position
    const pendingHighlight = useAppSelector(
        (state) => state.toolbar.pendingHighlight
    );

    const handleOnClick = () => {
        if (!pendingHighlight || position.y === null) {
            return;
        }

        console.log("toolbar position:", position);
        // Get the page element to calculate relative position
        const pageElement = document.querySelector(
            `[data-page-number="${pendingHighlight.pageNumber}"]`
        ); // returns the page with the attribute from the document
        const pageRect = pageElement?.getBoundingClientRect();
        console.log("pageRect:", pageRect);
        const pageY = pageRect ? position.y - pageRect.top : position.y;
        // console.log(`pageY ${pageY}`);

        // Store pending comment data
        dispatch(
            setPendingComment({
                fileId: pendingHighlight.fileId,
                pageNumber: pendingHighlight.pageNumber,
                selectedText: pendingHighlight.text,
                position: {
                    x: 0, // Will be calculated in InputComment
                    y: position.y || 0,
                    pageY,
                },
            })
        );

        // Set comment input position (right side of the editor)
        dispatch(setCommentPosition({ x: 0, y: pageY }));
        // dispatch(setCommentPosition({ x: 300, y: position.y }));
        // dispatch(cancelCommentCreation());
        // dispatch(cancelHighlight());
    };

    return (
        <div
            className="flex h-full cursor-pointer items-center gap-2 rounded-lg p-2 transition-all hover:bg-gray-200"
            onClick={handleOnClick}
        >
            <span>
                <MessageSquareText size={15} />
            </span>
            <div className="text-sm">Comment</div>
        </div>
    );
}

export default Comment;
