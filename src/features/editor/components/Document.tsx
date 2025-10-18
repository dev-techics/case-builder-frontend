/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import InputComment from "@/features/toolbar/components/InputComment";
import { Toolbar } from "@/features/toolbar/Toolbar";
import {
    setPendingHighlight,
    setToolbarPosition,
} from "@/features/toolbar/toolbarSlice";
import {
    getPdfPageInfo,
    getTextSelectionCoordinates,
} from "@/lib/pdfCoordinateUtils";
import { InteractiveHighlightOverlay } from "../../toolbar/components/HighlightOverlay";
import { ScreenToPdfCoordinates } from "../helpers";
import type { TextHighlightableDocumentProps } from "../types";

/**
 * This component handles:
 * 1. Rendering the PDF document
 * 2. Detecting text selection (onMouseUp)
 * 3. Converting screen coordinates to PDF coordinates
 * 4. Storing pending highlight data in Redux
 * 5. Showing the color picker that scrolls with the content
 * 6. Rendering highlight overlays on top of PDF pages
 */

export function TextHighlightableDocument({
    file,
}: TextHighlightableDocumentProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageInfo, setPageInfo] = useState<Map<number, any>>(new Map());
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const scale = useAppSelector((states) => states.editor.scale);
    // const pageNumber = useAppSelector((states) => states.toolbar.pendingHighlight?.pageNumber);
    const fileId = useAppSelector(
        (states) => states.toolbar.pendingHighlight?.fileId
    );
    const CommentPosition = useAppSelector(
        (states) => states.toolbar.CommentPosition
    );
    const pendingHighlight = useAppSelector(
        (states) => states.toolbar.pendingHighlight
    );
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        console.log(`✅ PDF loaded: ${numPages} pages`);
    };

    // Load page information for all pages
    useEffect(() => {
        async function loadPageInfo() {
            if (!file.url || numPages === 0) {
                return;
            }

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

    // Handle text selection - This is where we capture the selection data
    const handleMouseUp = () => {
        // get user selection
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
            console.warn("⚠️ Could not determine which page was selected");
            return;
        }

        const pageData = pageInfo.get(selectedPageNumber);
        if (!pageData) {
            console.warn("⚠️ Page info not loaded yet");
            return;
        }

        // Get selection coordinates
        const selectionCoords = getTextSelectionCoordinates(pageElement);
        if (!selectionCoords) {
            return;
        }

        // Get page position for offset calculation
        const pageInfoWithOffset = {
            ...pageData,
            left: 0, // Relative to page element
            top: 0,
        };

        // Convert to PDF coordinates (for storage)
        const pdfCoords = ScreenToPdfCoordinates(
            selectionCoords,
            pageInfoWithOffset,
            scale
        );

        console.log("📍 Selection info:", {
            fileId: file.id,
            fileName: file.name,
            pageNumber: selectedPageNumber,
            text: selectionCoords.selectedText,
            pdfCoordinates: pdfCoords,
        });

        // Calculate position for Toolbar RELATIVE to container
        const containerRect = containerRef.current?.getBoundingClientRect();
        const pageRect = pageElement.getBoundingClientRect();

        if (!containerRect) {
            console.warn("⚠️ Container ref not available");
            return;
        }

        // Calculate position relative to the scrollable container
        const pickerX =
            pageRect.left -
            containerRect.left +
            selectionCoords.left +
            selectionCoords.width / 2;
        const pickerY = pageRect.top - containerRect.top + selectionCoords.top;

        // Store pending highlight data in Redux (using PDF coordinates)
        dispatch(
            setPendingHighlight({
                fileId: file.id,
                pageNumber: selectedPageNumber,
                coordinates: {
                    x: pdfCoords.x,
                    y: pdfCoords.y,
                    width: pdfCoords.width,
                    height: pdfCoords.height,
                },
                text: selectionCoords.selectedText,
            })
        );

        // Show color picker at the selection position
        dispatch(setToolbarPosition({ x: pickerX, y: pickerY }));
    };

    return (
        <div className="relative" onMouseUp={handleMouseUp} ref={containerRef}>
            {file.id === fileId ? <Toolbar /> : ""}


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
                    const pageData = pageInfo.get(pageNumber);
                    return (
                        <div
                            className="relative mb-4"
                            data-file-id={file.id}
                            data-page-number={pageNumber}
                            key={`page_${pageNumber}`}
                            ref={(el) => {
                                if (el) {
                                    pageRefs.current.set(pageNumber, el);
                                }
                            }}
                        >
                            {/* PDF Page */}
                            <Page
                                className="shadow-md"
                                pageNumber={pageNumber}
                                renderAnnotationLayer={true}
                                renderTextLayer={true}
                                scale={scale}
                            />

                            {/* Highlight Overlays - Rendered on top of the page */}
                            {pageData && (
                                <InteractiveHighlightOverlay
                                    fileId={file.id}
                                    pageHeight={pageData.height}
                                    pageNumber={pageNumber}
                                    scale={scale}
                                />
                            )}
                        </div>
                    );
                })}
            </Document>
            {/* Comment Input - Shows when user clicks "Comment" button */}
            {CommentPosition.x !== null &&
                CommentPosition.y !== null &&
                pendingHighlight?.fileId === file.id && <InputComment />}

        </div>
    );
}
