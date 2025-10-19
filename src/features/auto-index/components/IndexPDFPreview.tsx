import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { useAppSelector } from "@/app/hooks";
import { useGenerateIndexPDF } from "../hooks/useGenerateIndexPDF";

type IndexPDFPreviewProps = {
    scale?: number;
};

export function IndexPDFPreview({ scale = 1 }: IndexPDFPreviewProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

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
                setPdfUrl(url);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to generate index"
                );
            } finally {
                setIsLoading(false);
            }
        };

        generateAndDisplay();

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [indexEntries, generatePDF]);

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
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                >
                    <Page pageNumber={currentPage} scale={scale} />
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
