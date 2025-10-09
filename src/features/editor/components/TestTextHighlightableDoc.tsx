import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import {
    getPdfPageInfo,
    getTextSelectionCoordinates,
} from "@/lib/pdfCoordinateUtils";

type Highlight = {
    pageNumber: number;
    coordinates: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    text: string;
    id: string;
};

type TextHighlightableDocumentProps = {
    file: {
        url: string;
        name: string;
        id: string;
    };
    scale?: number;
    onHighlightCreate?: (highlight: Highlight) => void;
};

export function TextHighlightableDocument({
    file,
    scale = 1,
    onHighlightCreate,
}: TextHighlightableDocumentProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [pageInfo, setPageInfo] = useState<Map<number, any>>(new Map());
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        console.log(`✅ PDF loaded: ${numPages} pages`);
    };

    // Load page information for all pages
    useEffect(() => {
        async function loadPageInfo() {
            if (!file.url || numPages === 0) return;

            const infoMap = new Map();
            for (let i = 1; i <= numPages; i++) {
                try {
                    const info = await getPdfPageInfo(file.url, i);
                    infoMap.set(i, info);
                } catch (error) {
                    console.error(`Error loading page ${i} info:`, error);
                }
            }
            setPageInfo(infoMap);
        }

        loadPageInfo();
    }, [file.url, numPages]);

    // Handle text selection
    const handleMouseUp = () => {
        const selection = window.getSelection();

        if (!selection || selection.toString().trim() === "") {
            return;
        }

        // Find which page the selection is on
        let selectedPageNumber: number | null = null;
        let pageElement: HTMLElement | null = null;

        pageRefs.current.forEach((element, pageNumber) => {
            if (
                element &&
                selection.containsNode &&
                selection.containsNode(element, true)
            ) {
                selectedPageNumber = pageNumber;
                pageElement = element;
            }
        });

        if (!(selectedPageNumber && pageElement)) {
            return;
        }

        const pageData = pageInfo.get(selectedPageNumber);
        if (!pageData) {
            return;
        }

        // Get selection coordinates
        const selectionCoords = getTextSelectionCoordinates(pageElement);

        if (!selectionCoords) {
            return;
        }

        // Get page position for offset calculation
        const pageRect = pageElement.getBoundingClientRect();
        const pageInfoWithOffset = {
            ...pageData,
            left: 0, // Relative to page element
            top: 0,
        };

        // Convert to PDF coordinates
        const pdfCoords = ScreenToPdfCoordinates(
            selectionCoords,
            pageInfoWithOffset,
            scale
        );

        const highlight: Highlight = {
            pageNumber: selectedPageNumber,
            coordinates: {
                x: pdfCoords.x,
                y: pdfCoords.y,
                width: pdfCoords.width,
                height: pdfCoords.height,
            },
            text: selectionCoords.selectedText,
            id: `highlight-${Date.now()}-${Math.random()}`,
        };

        setHighlights((prev) => [...prev, highlight]);

        if (onHighlightCreate) {
            onHighlightCreate(highlight);
        }

        console.log("📝 Highlight created:", highlight);

        // Clear selection
        selection.removeAllRanges();
    };

    // Helper function for coordinate conversion
    const ScreenToPdfCoordinates = (
        screenCoords: any,
        pageData: any,
        scale: number
    ) => {
        const pdfLeft = (screenCoords.left - (pageData.left || 0)) / scale;
        const pdfTop = (screenCoords.top - (pageData.top || 0)) / scale;
        const pdfRight = (screenCoords.right - (pageData.left || 0)) / scale;
        const pdfBottom = (screenCoords.bottom - (pageData.top || 0)) / scale;

        const pdfY = pageData.height - pdfBottom;
        const pdfHeight = pdfBottom - pdfTop;

        return {
            x: pdfLeft,
            y: pdfY,
            width: pdfRight - pdfLeft,
            height: pdfHeight,
        };
    };

    return (
        <div className="relative" onMouseUp={handleMouseUp}>
            <Document
                file={file.url}
                loading={
                    <div className="flex h-96 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
                            <p className="text-gray-500">Loading PDF...</p>
                        </div>
                    </div>
                }
                onLoadSuccess={onDocumentLoadSuccess}
            >
                {Array.from(new Array(numPages), (_, index) => {
                    const pageNumber = index + 1;
                    return (
                        <div
                            className="relative mb-4"
                            key={`page_${pageNumber}`}
                            ref={(el) => {
                                if (el) {
                                    pageRefs.current.set(pageNumber, el);
                                }
                            }}
                        >
                            <Page
                                className="shadow-md"
                                pageNumber={pageNumber}
                                renderAnnotationLayer={true}
                                renderTextLayer={true}
                                scale={scale}
                            />
                        </div>
                    );
                })}
            </Document>

            {/* Display highlights info */}
            {highlights.length > 0 && (
                <div className="fixed right-4 bottom-4 max-h-64 max-w-md overflow-y-auto rounded-lg border bg-white p-4 shadow-lg">
                    <h3 className="mb-2 font-bold">Highlights ({highlights.length})</h3>
                    {highlights.map((h) => (
                        <div className="mb-2 border-b pb-2 text-sm" key={h.id}>
                            <div className="font-medium">Page {h.pageNumber}</div>
                            <div className="truncate text-gray-600">{h.text}</div>
                            <div className="mt-1 text-gray-400 text-xs">
                                x: {h.coordinates.x.toFixed(2)}, y: {h.coordinates.y.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
