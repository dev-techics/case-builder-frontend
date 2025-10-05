import { FileText, Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    selectFile,
    setScrollToFile,
} from "../../features/file-explorer/fileTreeSlice";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type PdfDocumentInfo = {
    fileId: string;
    numPages: number;
};

export const PDFViewer: React.FC = () => {
    const dispatch = useAppDispatch();
    const tree = useAppSelector((state) => state.fileTree.tree);
    const selectedFile = useAppSelector((state) => state.fileTree.selectedFile);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const isScrollingFromEditor = useRef(false);

    const [documentInfo, setDocumentInfo] = useState<{
        [key: string]: PdfDocumentInfo;
    }>({});
    const [scale, setScale] = useState(1.0);

    // Handle scroll in editor to highlight corresponding file in sidebar
    const handleScroll = () => {
        if (!containerRef.current || isScrollingFromEditor.current) return;

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const scrollCenter = scrollTop + containerHeight / 2;

        // Find which PDF is currently in view
        let currentFileId: string | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        Object.entries(fileRefs.current).forEach(([fileId, element]) => {
            if (element) {
                const rect = element.getBoundingClientRect();
                const elementCenter =
                    rect.top +
                    rect.height / 2 -
                    container.getBoundingClientRect().top +
                    scrollTop;
                const distance = Math.abs(elementCenter - scrollCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    currentFileId = fileId;
                }
            }
        });

        if (currentFileId && currentFileId !== selectedFile) {
            dispatch(selectFile(currentFileId));
            dispatch(setScrollToFile(currentFileId));

            // Reset scroll to file after a short delay
            setTimeout(() => {
                dispatch(setScrollToFile(null));
            }, 100);
        }
    };

    // Scroll to selected file when clicked in sidebar
    useEffect(() => {
        if (selectedFile && fileRefs.current[selectedFile]) {
            isScrollingFromEditor.current = true;
            fileRefs.current[selectedFile]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            setTimeout(() => {
                isScrollingFromEditor.current = false;
            }, 1000);
        }
    }, [selectedFile]);

    const handleDocumentLoadSuccess = (
        fileId: string,
        { numPages }: { numPages: number }
    ) => {
        setDocumentInfo((prev) => ({
            ...prev,
            [fileId]: { fileId, numPages },
        }));
    };

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.2, 3.0));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.2, 0.5));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        // Handle file upload logic here
        console.log("Files to upload:", files);
    };

    if (tree.children.length === 0) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Upload className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <p className="mb-2 font-medium text-gray-600 text-lg">
                        No documents yet
                    </p>
                    <p className="mb-4 text-gray-400 text-sm">
                        Upload PDF files to get started
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        <Upload className="h-4 w-4" />
                        Upload PDFs
                        <input
                            accept=".pdf"
                            className="hidden"
                            multiple
                            onChange={handleFileUpload}
                            type="file"
                        />
                    </label>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-4 border-b bg-white p-4">
                <button
                    aria-label="Zoom out"
                    className="rounded p-2 hover:bg-gray-100"
                    onClick={handleZoomOut}
                >
                    <ZoomOut className="h-5 w-5" />
                </button>
                <span className="min-w-[60px] text-center font-medium text-sm">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    aria-label="Zoom in"
                    className="rounded p-2 hover:bg-gray-100"
                    onClick={handleZoomIn}
                >
                    <ZoomIn className="h-5 w-5" />
                </button>
            </div>

            {/* PDF Documents Container */}
            <div
                className="flex-1 overflow-y-auto bg-gray-100 p-8"
                onScroll={handleScroll}
                ref={containerRef}
            >
                <div className="mx-auto max-w-4xl space-y-8">
                    {tree.children.map((file, index) => (
                        <div
                            className={`overflow-hidden rounded-lg bg-white shadow-lg transition-all ${selectedFile === file.id ? "ring-4 ring-blue-500" : ""
                                }`}
                            key={file.id}
                            ref={(el) => {
                                fileRefs.current[file.id] = el;
                            }}
                        >
                            {/* PDF Header */}
                            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-red-500" />
                                    <span className="font-medium text-gray-700">{file.name}</span>
                                    <span className="text-gray-400 text-sm">#{index + 1}</span>
                                    {documentInfo[file.id] && (
                                        <span className="text-gray-400 text-xs">
                                            ({documentInfo[file.id].numPages} pages)
                                        </span>
                                    )}
                                </div>
                                <button
                                    aria-label={`Delete ${file.name}`}
                                    className="rounded p-1 hover:bg-gray-200"
                                    onClick={() => console.log("Delete", file.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>

                            {/* PDF Content Area */}
                            <div className="flex flex-col items-center p-4">
                                {file.url ? (
                                    <Document
                                        error={
                                            <div className="flex h-96 items-center justify-center rounded border-2 border-red-200 bg-red-50">
                                                <div className="text-center">
                                                    <FileText className="mx-auto mb-2 h-12 w-12 text-red-300" />
                                                    <p className="text-red-600">Failed to load PDF</p>
                                                </div>
                                            </div>
                                        }
                                        file={file.url}
                                        loading={
                                            <div className="flex h-96 items-center justify-center">
                                                <p className="text-gray-500">Loading PDF...</p>
                                            </div>
                                        }
                                        onLoadSuccess={(pdf) =>
                                            handleDocumentLoadSuccess(file.id, pdf)
                                        }
                                    >
                                        {documentInfo[file.id] &&
                                            Array.from(
                                                new Array(documentInfo[file.id].numPages),
                                                (el, index) => (
                                                    <Page
                                                        className="mb-4 shadow-md"
                                                        key={`page_${index + 1}`}
                                                        pageNumber={index + 1}
                                                        renderAnnotationLayer={true}
                                                        renderTextLayer={true}
                                                        scale={scale}
                                                    />
                                                )
                                            )}
                                    </Document>
                                ) : (
                                    <div className="flex h-96 w-full items-center justify-center rounded border-2 border-gray-300 border-dashed bg-gray-50">
                                        <div className="text-center">
                                            <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                                            <p className="text-gray-500">PDF preview not available</p>
                                            <p className="mt-1 text-gray-400 text-sm">
                                                Upload a PDF file to view it here
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
