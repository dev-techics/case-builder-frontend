/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <explanation> */

import { CircleX } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { removeHighlight } from "@/features/toolbar/toolbarSlice";
import type { Highlight, HighlightOverlayProps } from "../types";

/**
 * Converts PDF coordinates to screen coordinates for HTML overlay rendering
 */
function pdfToScreenCoordinates(
    pdfCoords: { x: number; y: number; width: number; height: number },
    pageHeight: number,
    scale: number
) {
    return {
        x: pdfCoords.x * scale,
        // Flip Y-axis: PDF origin is bottom-left, Screen origin is top-left
        y: (pageHeight - pdfCoords.y - pdfCoords.height) * scale,
        width: pdfCoords.width * scale,
        height: pdfCoords.height * scale,
    };
}

/**
 * Single highlight overlay element (non-interactive)
 */
function HighlightElement({
    highlight,
    pageHeight,
    scale,
}: {
    highlight: Highlight;
    pageHeight: number;
    scale: number;
}) {
    const screenCoords = pdfToScreenCoordinates(
        highlight.coordinates,
        pageHeight,
        scale
    );

    return (
        <div
            className="pointer-events-none absolute transition-all duration-150"
            style={{
                left: `${screenCoords.x}px`,
                top: `${screenCoords.y}px`,
                width: `${screenCoords.width}px`,
                height: `${screenCoords.height}px`,
                backgroundColor: highlight.color.hex,
                opacity: highlight.color.opacity,
                mixBlendMode: "multiply",
            }}
            title={`${highlight.color.name} highlight: "${highlight.text}"`}
        />
    );
}

/**
 * Basic overlay container (non-interactive)
 */
export function HighlightOverlay({
    fileId,
    pageNumber,
    pageHeight,
    scale,
}: HighlightOverlayProps) {
    const allHighlights = useAppSelector((state) => state.toolbar.highlights);

    const pageHighlights = allHighlights.filter(
        (h) => h.fileId === fileId && h.pageNumber === pageNumber
    );

    if (pageHighlights.length === 0) {
        return null;
    }

    return (
        <div
            className="pointer-events-none absolute inset-0"
            style={{
                width: "100%",
                height: "100%",
            }}
        >
            {pageHighlights.map((highlight) => (
                <HighlightElement
                    highlight={highlight}
                    key={highlight.id}
                    pageHeight={pageHeight}
                    scale={scale}
                />
            ))}
        </div>
    );
}

/**
 * Interactive version with delete button on hover
 */
export function InteractiveHighlightOverlay({
    fileId,
    pageNumber,
    pageHeight,
    scale,
    onHighlightClick,
}: HighlightOverlayProps & {
    onHighlightClick?: (highlight: Highlight) => void;
}) {
    const dispatch = useAppDispatch();
    const allHighlights = useAppSelector((state) => state.toolbar.highlights);

    const pageHighlights = allHighlights.filter(
        (h) => h.fileId === fileId && h.pageNumber === pageNumber
    );

    const handleDelete = (e: React.MouseEvent, highlightId: string) => {
        e.stopPropagation(); // Prevent triggering onClick
        dispatch(removeHighlight(highlightId));
    };

    if (pageHighlights.length === 0) {
        return null;
    }

    return (
        <div
            className="absolute inset-0"
            style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none", // Allow text selection to work
            }}
        >
            {pageHighlights.map((highlight) => {
                const screenCoords = pdfToScreenCoordinates(
                    highlight.coordinates,
                    pageHeight,
                    scale
                );

                return (
                    <div
                        className="group absolute"
                        key={highlight.id}
                        style={{
                            left: `${screenCoords.x}px`,
                            top: `${screenCoords.y}px`,
                            width: `${screenCoords.width}px`,
                            height: `${screenCoords.height}px`,
                            pointerEvents: "auto", // Re-enable for this element
                        }}
                    >
                        {/* The highlight background */}
                        <div
                            className="absolute inset-0 cursor-pointer transition-opacity hover:opacity-90"
                            onClick={() => onHighlightClick?.(highlight)}
                            style={{
                                backgroundColor: highlight.color.hex,
                                opacity: highlight.color.opacity,
                                mixBlendMode: "multiply",
                            }}
                            title={highlight.text}
                        />

                        {/* Delete button - appears on hover */}
                        <button
                            className="-right-2 -top-2 absolute z-10 flex h-6 w-6 items-center justify-center rounded-full text-white opacity-0 shadow-lg transition-all duration-200 hover:scale-110 group-hover:opacity-100"
                            onClick={(e) => handleDelete(e, highlight.id)}
                            title="Delete highlight"
                            type="button"
                        >
                            <CircleX className="h-5 w-5 cursor-pointer rounded-full bg-gray-800" />
                        </button>

                        {/* Tooltip - appears on hover (below the highlight) */}
                        <div className="pointer-events-none absolute top-full left-0 z-20 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            <div className="font-medium">{highlight.color.name}</div>
                            <div className="max-w-xs truncate text-gray-300">
                                "{highlight.text.substring(0, 50)}
                                {highlight.text.length > 50 ? "..." : ""}"
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
