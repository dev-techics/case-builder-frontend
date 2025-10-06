import { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAppSelector } from "@/app/hooks";
import type {
    DocumentComponentProps,
    PdfDocumentInfo,
    PdfError,
} from "../types";
import ErrorComp from "./ui/ErrorComp";

function DocumentComponent({ file }: DocumentComponentProps) {
    const scale = useAppSelector((state) => state.editor.scale);

    const [documentInfo, setDocumentInfo] = useState<{
        [key: string]: PdfDocumentInfo;
    }>({});

    const [pdfErrors, setPdfErrors] = useState<{
        [key: string]: PdfError;
    }>({});

    const options = useMemo(
        () => ({
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
        }),
        []
    );

    const handleDocumentLoadSuccess = (
        fileId: string,
        { numPages }: { numPages: number }
    ) => {
        console.log(`✅ PDF loaded successfully: ${fileId}, Pages: ${numPages}`);
        setDocumentInfo((prev) => ({
            ...prev,
            [fileId]: { fileId, numPages },
        }));
        // Clear any previous errors for this file
        setPdfErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fileId];
            return newErrors;
        });
    };

    const handleDocumentLoadError = (fileId: string, error: Error) => {
        console.error(`❌ PDF load error for ${fileId}:`, error);
        setPdfErrors((prev) => ({
            ...prev,
            [fileId]: {
                fileId,
                message: error.message || "Unknown error",
            },
        }));
    };

    return (
        <Document
            error={<ErrorComp error={pdfErrors[file.id]} file={file} />}
            file={file.url}
            loading={
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
                        <p className="text-gray-500">Loading PDF...</p>
                        <p className="mt-1 text-gray-400 text-sm">{file.name}</p>
                    </div>
                </div>
            }
            onLoadError={(error) => handleDocumentLoadError(file.id, error)}
            onLoadSuccess={(pdf) => handleDocumentLoadSuccess(file.id, pdf)}
            options={options}
        >
            {documentInfo[file.id] &&
                Array.from(
                    new Array(documentInfo[file.id].numPages),
                    (el, pageIndex) => (
                        <Page
                            className="mb-4 shadow-md"
                            key={`page_${pageIndex + 1}`}
                            loading={
                                <div className="flex h-96 items-center justify-center bg-gray-50">
                                    <p className="text-gray-400 text-sm">
                                        Loading page {pageIndex + 1}...
                                    </p>
                                </div>
                            }
                            pageNumber={pageIndex + 1}
                            renderAnnotationLayer={true}
                            renderTextLayer={true}
                            scale={scale}
                        />
                    )
                )}
        </Document>
    );
}

export default DocumentComponent;
