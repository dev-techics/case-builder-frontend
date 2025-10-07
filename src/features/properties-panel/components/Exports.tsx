import { Download } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";

function Exports() {
    const tree = useAppSelector((states) => states.fileTree.tree);
    const { headerLeft, headerRight, footer } = useAppSelector((states) => states.propertiesPanel.headersFooter);
    /*------------------------------------
             Export function with pdf-lib
         ---------------------------------*/
    const handleExport = async () => {
        try {
            const pdfDoc = await PDFDocument.create();
            let totalPages = 0;

            // Collect all PDF URLs from your file tree
            const pdfFiles = tree.children.filter((file) => file.url);

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

                totalPages += loadedPdf.getPageCount();
            }

            // Add footer text and page numbers to every page
            const pages = pdfDoc.getPages();
            pages.forEach((page, index) => {
                const { width, height } = page.getSize();
                const pageNumber = index + 1;

                // Header left
                page.drawText(headerLeft, {
                    x: 50,
                    y: height - 25,
                    size: 10,
                    color: rgb(0.4, 0.4, 0.4),
                });

                // Header right
                page.drawText(headerRight, {
                    x: width - 120,
                    y: height - 25,
                    size: 10,
                    color: rgb(0.4, 0.4, 0.4),
                });

                // Footer text
                page.drawText(footer, {
                    x: 50,
                    y: 25,
                    size: 10,
                    color: rgb(0.4, 0.4, 0.4),
                });

                // Page number
                page.drawText(`Page ${pageNumber} of ${pages.length}`, {
                    x: width - 120,
                    y: 25,
                    size: 10,
                    color: rgb(0.4, 0.4, 0.4),
                });
            });

            // Save the final merged PDF
            const pdfBytes = await pdfDoc.save();

            // Trigger download
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Merged_PDFs_With_Footer.pdf";
            link.click();
        } catch (error) {
            console.error("Error exporting PDFs:", error);
        }
    };
    return (
        <div className="w-full">
            <Button className="mx-2 rounded-sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export All
            </Button>
        </div>
    );
}

export default Exports;
