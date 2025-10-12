import { useAppSelector } from "@/app/hooks";
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
 * Single highlight overlay element
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
                mixBlendMode: "multiply", // Makes it look like real highlighting
            }}
            title={`${highlight.color.name} highlight: "${highlight.text}"`}
        />
    );
}

/**
 * Overlay container for all highlights on a specific page
 * This component renders HTML divs positioned over the PDF canvas
 */
export function HighlightOverlay({
    fileId,
    pageNumber,
    pageHeight,
    scale,
}: HighlightOverlayProps) {
    // Get all highlights from Redux
    const allHighlights = useAppSelector((state) => state.editor.highlights);

    // Filter highlights for this specific file and page
    const pageHighlights = allHighlights.filter(
        (h) => h.fileId === fileId && h.pageNumber === pageNumber
    );

    // Don't render anything if no highlights
    if (pageHighlights.length === 0) {
        return null;
    }

    return (
        <div
            className="pointer-events-none absolute inset-0"
            style={{
                // Ensure overlay covers the entire page
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
 * Alternative: Interactive version with hover effects and click handlers
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
    const allHighlights = useAppSelector((state) => state.editor.highlights);

    const pageHighlights = allHighlights.filter(
        (h) => h.fileId === fileId && h.pageNumber === pageNumber
    );

    if (pageHighlights.length === 0) {
        return null;
    }

    return (
        <div
            className="absolute inset-0"
            style={{
                width: "100%",
                height: "100%",
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
                        className="group absolute cursor-pointer transition-all duration-150 hover:opacity-80"
                        key={highlight.id}
                        onClick={() => onHighlightClick?.(highlight)}
                        style={{
                            left: `${screenCoords.x}px`,
                            top: `${screenCoords.y}px`,
                            width: `${screenCoords.width}px`,
                            height: `${screenCoords.height}px`,
                            backgroundColor: highlight.color.hex,
                            opacity: highlight.color.opacity,
                            mixBlendMode: "multiply",
                        }}
                        title={`Click to edit: "${highlight.text}"`}
                    >
                        {/* Optional: Show highlight info on hover */}
                        <div className="-top-8 pointer-events-none absolute left-0 z-10 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                            {highlight.color.name} - "{highlight.text.substring(0, 30)}..."
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
