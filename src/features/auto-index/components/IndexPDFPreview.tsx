/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { useAppSelector } from "@/app/hooks";
import { useGenerateIndexPDF } from "../hooks/useGenerateIndexPDF";

type IndexPDFPreviewProps = {
    scale?: number;
};

const IndexPDFPreview = ({ scale = 1 }: IndexPDFPreviewProps) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Track the URL to revoke it properly
    const urlToRevokeRef = useRef<string | null>(null);

    const indexEntries = useAppSelector((state) => state.indexGenerator.entries);
    const { generatePDF } = useGenerateIndexPDF();

    useEffect(() => {
        const generateAndDisplay = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setCurrentPage(1);
                setNumPages(0);

                if (indexEntries.length === 0) {
                    setError("No files in project to generate index");
                    return;
                }

                const blob = await generatePDF(indexEntries);
                const url = URL.createObjectURL(blob);

                // Revoke old URL before setting new one
                if (urlToRevokeRef.current) {
                    URL.revokeObjectURL(urlToRevokeRef.current);
                }

                urlToRevokeRef.current = url;
                setPdfUrl(url);
            } catch (err) {
                console.error("Error generating index PDF:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to generate index"
                );
            } finally {
                setIsLoading(false);
            }
        };

        generateAndDisplay();

        // Cleanup only on unmount
        return () => {
            if (urlToRevokeRef.current) {
                URL.revokeObjectURL(urlToRevokeRef.current);
                urlToRevokeRef.current = null;
            }
        };
    }, [indexEntries]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < numPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-medium text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    if (isLoading || !pdfUrl) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-2 text-gray-500 text-sm">Generating index...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            {/* PDF Viewer */}
            <div className="flex justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Document
                    error={
                        <div className="p-4 text-center text-red-500">
                            Failed to load index
                        </div>
                    }
                    file={pdfUrl}
                    loading={
                        <div className="flex items-center justify-center p-4">
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    }
                    onLoadError={(error) => {
                        console.error("❌ Index PDF load error:", error);
                        setError("Failed to load index PDF");
                    }}
                    onLoadSuccess={({ numPages }) => {
                        console.log(`✅ Index PDF loaded: ${numPages} page(s)`);
                        setNumPages(numPages);
                    }}
                >
                    <Page
                        pageNumber={currentPage}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        scale={scale}
                    />
                </Document>
            </div>

            {/* Page Navigation */}
            {numPages > 1 && (
                <div className="flex w-full items-center justify-center gap-3">
                    <button
                        className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={handlePreviousPage}
                        title="Previous page"
                        type="button"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="min-w-[100px] text-center text-gray-600 text-xs">
                        Page {currentPage} of {numPages}
                    </span>

                    <button
                        className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={currentPage === numPages}
                        onClick={handleNextPage}
                        title="Next page"
                        type="button"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default IndexPDFPreview;
