// features/properties-panel/components/Exports.tsx
import { AlertCircle, CheckCircle, Download, FileStack } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { useGenerateIndexPDF } from "@/features/auto-index/hooks/useGenerateIndexPDF";

function Exports() {
    const tree = useAppSelector((states) => states.fileTree.tree);
    const { headerLeft, headerRight, footer } = useAppSelector(
        (states) => states.propertiesPanel.headersFooter
    );
    const indexEntries = useAppSelector((state) => state.indexGenerator.entries);
    const { generatePDF: generateIndexPDF } = useGenerateIndexPDF();

    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success" | "error">("idle");
    const [exportMessage, setExportMessage] = useState("");
    const [includeIndex, setIncludeIndex] = useState(true);

    const pdfFiles = tree.children.filter((file) => file.url);
    const hasFiles = pdfFiles.length > 0;

    const handleExport = async () => {
        if (!hasFiles) {
            setExportStatus("error");
            setExportMessage("No PDF files to export");
            return;
        }

        setIsExporting(true);
        setExportStatus("exporting");
        setExportMessage("Processing your files...");

        try {
            const pdfDoc = await PDFDocument.create();

            // Add index as first page if enabled
            if (includeIndex && indexEntries.length > 0) {
                try {
                    const indexBlob = await generateIndexPDF(indexEntries);
                    const indexBytes = await indexBlob.arrayBuffer();
                    const indexPdf = await PDFDocument.load(indexBytes);
                    const indexPages = await pdfDoc.copyPages(
                        indexPdf,
                        indexPdf.getPageIndices()
                    );
                    indexPages.forEach((page) => {
                        pdfDoc.addPage(page);
                    });
                    setExportMessage("Index page added...");
                } catch (error) {
                    console.error("Error adding index:", error);
                    // Continue without index if there's an error
                }
            }

            // Add all PDF files
            for (const file of pdfFiles) {
                const existingPdfBytes = await fetch(file.url).then((res) =>
                    res.arrayBuffer()
                );
                const loadedPdf = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await pdfDoc.copyPages(
                    loadedPdf,
                    loadedPdf.getPageIndices()
                );
                copiedPages.forEach((page) => {
                    pdfDoc.addPage(page);
                });
            }

            // Add headers/footers to all pages
            const pages = pdfDoc.getPages();
            pages.forEach((page, index) => {
                const { width, height } = page.getSize();
                const pageNumber = index + 1;

                if (headerLeft) {
                    page.drawText(headerLeft.text, {
                        x: 50,
                        y: height - 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }

                if (headerRight) {
                    page.drawText(headerRight.text, {
                        x: width - 120,
                        y: height - 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }

                if (footer) {
                    page.drawText(footer.text, {
                        x: 50,
                        y: 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }

                page.drawText(`Page ${pageNumber} of ${pages.length}`, {
                    x: width - 120,
                    y: 25,
                    size: 10,
                    color: rgb(0.4, 0.4, 0.4),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${tree.name || "Project"}_${new Date().getTime()}.pdf`;
            link.click();

            setExportStatus("success");
            setExportMessage(
                `Successfully exported ${pages.length} pages${includeIndex ? " (including index)" : ""
                }`
            );

            setTimeout(() => {
                setExportStatus("idle");
                setExportMessage("");
            }, 3000);
        } catch (error) {
            console.error("Error exporting PDFs:", error);
            setExportStatus("error");
            setExportMessage(
                error instanceof Error ? error.message : "Failed to export PDFs"
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Export Summary */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                    <FileStack className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-700 text-sm">
                        Export Summary
                    </span>
                </div>
                <div className="space-y-1 text-gray-600 text-xs">
                    <div className="flex justify-between">
                        <span>Files to merge:</span>
                        <span className="font-semibold text-gray-900">
                            {pdfFiles.length}
                        </span>
                    </div>
                    {pdfFiles.length > 0 && (
                        <div className="text-gray-500">
                            {pdfFiles.map((f) => (
                                <div className="ml-2 truncate" key={f.id}>
                                    • {f.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Export Options */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="mb-2 font-semibold text-blue-900 text-xs">
                    Export Options
                </p>
                <div className="space-y-2 text-blue-800 text-xs">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            checked={includeIndex}
                            className="rounded"
                            onChange={(e) => setIncludeIndex(e.target.checked)}
                            type="checkbox"
                        />
                        <span>Include index as first page</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            checked={true}
                            className="rounded"
                            readOnly
                            type="checkbox"
                        />
                        <span>Merge all PDFs into one document</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            checked={!!headerLeft || !!headerRight}
                            className="rounded"
                            readOnly
                            type="checkbox"
                        />
                        <span>Include headers</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            checked={!!footer}
                            className="rounded"
                            readOnly
                            type="checkbox"
                        />
                        <span>Include footer</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            checked={true}
                            className="rounded"
                            readOnly
                            type="checkbox"
                        />
                        <span>Add page numbers</span>
                    </label>
                </div>
            </div>

            {/* Status Messages */}
            {exportStatus === "success" && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <div>
                        <p className="font-semibold text-green-900 text-xs">
                            Export successful
                        </p>
                        <p className="mt-0.5 text-green-700 text-xs">{exportMessage}</p>
                    </div>
                </div>
            )}

            {exportStatus === "error" && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <div>
                        <p className="font-semibold text-red-900 text-xs">Export failed</p>
                        <p className="mt-0.5 text-red-700 text-xs">{exportMessage}</p>
                    </div>
                </div>
            )}

            {exportStatus === "exporting" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="font-semibold text-blue-900 text-xs">{exportMessage}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                        <div className="h-full animate-pulse bg-blue-500" />
                    </div>
                </div>
            )}

            {/* Export Button */}
            <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={!hasFiles || isExporting}
                onClick={handleExport}
            >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export All"}
            </Button>

            {!hasFiles && (
                <p className="text-center text-gray-500 text-xs">
                    No PDF files available to export
                </p>
            )}
        </div>
    );
}

export default Exports;
