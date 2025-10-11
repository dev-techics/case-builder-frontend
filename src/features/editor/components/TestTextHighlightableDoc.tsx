/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { useAppDispatch } from "@/app/hooks";
import {
    getPdfPageInfo,
    getTextSelectionCoordinates,
} from "@/lib/pdfCoordinateUtils";
import { setColorPickerPosition, setPendingHighlight } from "../editorSlice";
import { ScreenToPdfCoordinates } from "../helpers";
import type { TextHighlightableDocumentProps } from "../types";
import { HighlightColorPicker } from "./ColorPicker";

/**
 * This component handles:
 * 1. Rendering the PDF document
 * 2. Detecting text selection (onMouseUp)
 * 3. Converting screen coordinates to PDF coordinates
 * 4. Storing pending highlight data in Redux
 * 5. Showing the color picker
 *
 * The ColorPicker component handles:
 * 1. Displaying color options
 * 2. Creating the final highlight with the selected color
 */

export function TextHighlightableDocument({
    file,
    scale = 1,
}: TextHighlightableDocumentProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageInfo, setPageInfo] = useState<Map<number, any>>(new Map());
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const dispatch = useAppDispatch();

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

    // Handle text selection - This is where we capture the selection data
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

        // Convert to PDF coordinates
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
            coordinates: pdfCoords,
        });

        // Calculate position for color picker (center top of selection)
        const pageRect = pageElement.getBoundingClientRect();
        const pickerX =
            pageRect.left + selectionCoords.left + selectionCoords.width / 2;
        const pickerY = pageRect.top + selectionCoords.top + window.scrollY;

        // Store pending highlight data in Redux
        // This data will be used by the ColorPicker to create the final highlight
        dispatch(
            setPendingHighlight({
                fileId: file.id, // Important: Track which file this highlight belongs to
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
        dispatch(setColorPickerPosition({ x: pickerX, y: pickerY }));
    };

    return (
        <div className="relative" onMouseUp={handleMouseUp}>
            {/* Color Picker - Global, appears above selections */}
            <HighlightColorPicker />

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

                            {/* Optional: Show page number overlay */}
                            <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-1 text-white text-xs">
                                Page {pageNumber}
                            </div>
                        </div>
                    );
                })}
            </Document>
        </div>
    );
}
