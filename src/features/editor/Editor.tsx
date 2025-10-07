import { FileText, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { pdfjs } from "react-pdf";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    selectFile,
    setScrollToFile,
} from "../../features/file-explorer/fileTreeSlice";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import DocumentComponent from "./components/Document";
import UploadFile from "./components/UploadFile";
import type { PdfDocumentInfo } from "./types";

// Option 2: If Option 1 doesn't work, try this:
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer: React.FC = () => {
    const dispatch = useAppDispatch();
    const tree = useAppSelector((state) => state.fileTree.tree);
    const selectedFile = useAppSelector((state) => state.fileTree.selectedFile);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const isScrollingFromEditor = useRef(false);
    const [documentInfo, setDocumentInfo] = useState<{
        [key: string]: PdfDocumentInfo;
    }>({});

    /*--------------------------------
          Scroll Synchronization Logic
      --------------------------------*/

    const handleScroll = () => {
        if (!containerRef.current || isScrollingFromEditor.current) {
            return;
        }

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const scrollCenter = scrollTop + containerHeight / 2;

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

            setTimeout(() => {
                dispatch(setScrollToFile(null));
            }, 100);
        }
    };

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

    /*-------------------------------------------------------------
                    Empty State
      ---------------------------------------------------------------*/
    if (tree.children.length === 0) {
        return <UploadFile />;
    }

    return (
        <div className="flex h-full flex-col">
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
                                    type="button"
                                >
                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>

                            {/* PDF Content Area */}
                            <div className="flex flex-col items-center p-4">
                                {file.url ? (
                                    <DocumentComponent file={file} />
                                ) : (
                                    <div className="flex h-96 w-full items-center justify-center rounded border-2 border-gray-300 border-dashed bg-gray-50">
                                        <div className="text-center">
                                            <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                                            <p className="text-gray-500">No PDF URL available</p>
                                            <p className="mt-1 text-gray-400 text-sm">
                                                Re-upload this file
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

export default PDFViewer;
