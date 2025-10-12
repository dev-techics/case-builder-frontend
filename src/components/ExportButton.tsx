/** biome-ignore-all lint/suspicious/noConsole: <explanation> */

import { PDFDocument, rgb } from "pdf-lib";
import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";

type ExportPdfButtonProps = {
    fileId?: string; // Optional: export specific file, or merge all if not provided
    className?: string;
    mergeAll?: boolean; // New: whether to merge all PDFs into one
};

/**
 * Button component that generates PDF with highlights
 * Can either:
 * 1. Export each file separately
 * 2. Merge all files into one PDF (when mergeAll=true)
 */
export function ExportPdfButton({
    fileId,
    mergeAll = true, // Default to merging all files
}: ExportPdfButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tree = useAppSelector((state) => state.fileTree.tree);
    const highlights = useAppSelector((state) => state.editor.highlights);
    const { headerLeft, headerRight, footer } = useAppSelector(
        (state) => state.propertiesPanel.headersFooter
    );

    const handleExport = async () => {
        try {
            setIsExporting(true);
            setError(null);

            // Get files to export
            const filesToExport = fileId
                ? tree.children.filter((f) => f.id === fileId && f.url)
                : tree.children.filter((f) => f.url);

            if (filesToExport.length === 0) {
                throw new Error("No files to export");
            }

            console.log(`📤 Exporting ${filesToExport.length} file(s)...`);

            if (mergeAll && !fileId) {
                // MERGE ALL FILES INTO ONE PDF
                await exportMergedPdf(
                    filesToExport,
                    highlights,
                    headerLeft,
                    headerRight,
                    footer
                );
            } else {
                // EXPORT FILES SEPARATELY
                await exportSeparateFiles(
                    filesToExport,
                    highlights,
                    headerLeft,
                    headerRight,
                    footer
                );
            }

            setIsExporting(false);
        } catch (err) {
            console.error("❌ Export error:", err);
            setError(err instanceof Error ? err.message : "Export failed");
            setIsExporting(false);
        }
    };

    const highlightCount = fileId
        ? highlights.filter((h) => h.fileId === fileId).length
        : highlights.length;

    return (
        <div>
            <Button
                disabled={
                    isExporting || tree.children.filter((f) => f.url).length === 0
                }
                onClick={handleExport}
            >
                {isExporting ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Exporting...
                    </>
                ) : (
                    <>
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                        {mergeAll && !fileId ? "Download Merged PDF" : "Download PDF"}
                    </>
                )}
            </Button>

            {error && <p className="mt-2 text-red-600 text-sm">Error: {error}</p>}

            {tree.children.filter((f) => f.url).length === 0 && (
                <p className="mt-2 text-gray-500 text-sm">No files to export</p>
            )}
        </div>
    );
}

/**
 * Export all files merged into a single PDF
 */
async function exportMergedPdf(
    files: any[],
    highlights: any[],
    headerLeft: any,
    headerRight: any,
    footer: any
) {
    console.log("📦 Merging all files into one PDF...");

    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();
    let globalPageNumber = 1; // Track page numbers across all files

    for (const file of files) {
        console.log(`📄 Processing ${file.name}...`);

        // Load the source PDF
        const existingPdfBytes = await fetch(file.url).then((res) =>
            res.arrayBuffer()
        );
        const sourcePdf = await PDFDocument.load(existingPdfBytes);

        // Get highlights for this file
        const fileHighlights = highlights.filter((h) => h.fileId === file.id);
        console.log(`  Found ${fileHighlights.length} highlights`);

        // Copy pages from source to merged PDF
        const copiedPages = await mergedPdf.copyPages(
            sourcePdf,
            sourcePdf.getPageIndices()
        );

        // Add each copied page and draw highlights
        for (let pageIndex = 0; pageIndex < copiedPages.length; pageIndex++) {
            const page = copiedPages[pageIndex];
            const originalPageNumber = pageIndex + 1; // Page number in original file

            mergedPdf.addPage(page);

            const { width, height } = page.getSize();

            // Draw highlights for this page
            const pageHighlights = fileHighlights.filter(
                (h) => h.pageNumber === originalPageNumber
            );

            console.log(
                `  Page ${globalPageNumber} (${file.name} p${originalPageNumber}): ${pageHighlights.length} highlights`
            );

            pageHighlights.forEach((highlight) => {
                const { x, y, width: w, height: h } = highlight.coordinates;
                const { r, g, b } = highlight.color.rgb;

                page.drawRectangle({
                    x,
                    y,
                    width: w,
                    height: h,
                    color: rgb(r, g, b),
                    opacity: highlight.color.opacity,
                    borderWidth: 0,
                });
            });

            // Add headers and footers
            if (headerLeft) {
                const text =
                    typeof headerLeft === "string" ? headerLeft : headerLeft.text || "";
                if (text) {
                    page.drawText(text, {
                        x: 50,
                        y: height - 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            if (headerRight) {
                const text =
                    typeof headerRight === "string"
                        ? headerRight
                        : headerRight.text || "";
                if (text) {
                    page.drawText(text, {
                        x: width - 120,
                        y: height - 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            if (footer) {
                const text = typeof footer === "string" ? footer : footer.text || "";
                if (text) {
                    page.drawText(text, {
                        x: 50,
                        y: 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            // Page number for merged document
            const totalPages = files.reduce((sum, f) => {
                const idx = files.indexOf(f);
                if (idx <= files.indexOf(file)) {
                    return (
                        sum +
                        (idx === files.indexOf(file)
                            ? copiedPages.length
                            : sourcePdf.getPageCount())
                    );
                }
                return sum;
            }, 0);

            page.drawText(`Page ${globalPageNumber} of ${totalPages}`, {
                x: width - 120,
                y: 25,
                size: 10,
                color: rgb(0.4, 0.4, 0.4),
            });

            globalPageNumber++;
        }
    }

    // Save and download the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `merged-highlighted-${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);

    console.log(`✅ Exported merged PDF with ${globalPageNumber - 1} pages`);
}

/**
 * Export files separately
 */
async function exportSeparateFiles(
    files: any[],
    highlights: any[],
    headerLeft: any,
    headerRight: any,
    footer: any
) {
    for (const file of files) {
        const fileHighlights = highlights.filter((h) => h.fileId === file.id);
        console.log(
            `📄 Processing ${file.name} with ${fileHighlights.length} highlights`
        );

        const existingPdfBytes = await fetch(file.url).then((res) =>
            res.arrayBuffer()
        );
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();

        pages.forEach((page, index) => {
            const { width, height } = page.getSize();
            const pageNumber = index + 1;
            const totalPages = pages.length;

            const pageHighlights = fileHighlights.filter(
                (h) => h.pageNumber === pageNumber
            );

            pageHighlights.forEach((highlight) => {
                const { x, y, width: w, height: h } = highlight.coordinates;
                const { r, g, b } = highlight.color.rgb;

                page.drawRectangle({
                    x,
                    y,
                    width: w,
                    height: h,
                    color: rgb(r, g, b),
                    opacity: highlight.color.opacity,
                    borderWidth: 0,
                });
            });

            if (headerLeft) {
                const text =
                    typeof headerLeft === "string" ? headerLeft : headerLeft.text || "";
                if (text) {
                    page.drawText(text, {
                        x: 50,
                        y: height - 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            if (headerRight) {
                const text =
                    typeof headerRight === "string"
                        ? headerRight
                        : headerRight.text || "";
                if (text) {
                    page.drawText(text, {
                        x: width - 120,
                        y: height - 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            if (footer) {
                const text = typeof footer === "string" ? footer : footer.text || "";
                if (text) {
                    page.drawText(text, {
                        x: 50,
                        y: 25,
                        size: 10,
                        color: rgb(0.4, 0.4, 0.4),
                    });
                }
            }

            page.drawText(`Page ${pageNumber} of ${totalPages}`, {
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
        link.download = `highlighted-${file.name}`;
        link.click();

        URL.revokeObjectURL(url);

        console.log(`✅ Exported ${file.name}`);
    }
}

/**
 * Compact version with merge/separate toggle
 */
export function ExportPdfButtonWithToggle({
    className,
}: {
    className?: string;
}) {
    const [mergeAll, setMergeAll] = useState(true);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <input
                    checked={mergeAll}
                    className="h-4 w-4"
                    id="merge-toggle"
                    onChange={(e) => setMergeAll(e.target.checked)}
                    type="checkbox"
                />
                <label className="text-gray-700 text-sm" htmlFor="merge-toggle">
                    Merge all files into one PDF
                </label>
            </div>
            <ExportPdfButton className={className} mergeAll={mergeAll} />
        </div>
    );
}
