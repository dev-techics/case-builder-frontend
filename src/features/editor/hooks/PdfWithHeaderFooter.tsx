/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { PDFDocument, rgb } from "pdf-lib";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";

export function useModifiedPDFs() {
    const tree = useAppSelector((state) => state.fileTree.tree);
    const { headerLeft, headerRight, footer } = useAppSelector(
        (state) => state.propertiesPanel.headersFooter
    );
    const [modifiedFiles, setModifiedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const generatedUrls: string[] = [];

        const generateModifiedPDFs = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const pdfFiles = tree.children.filter((file) => file.url);

                if (pdfFiles.length === 0) {
                    if (isMounted) {
                        setModifiedFiles([]);
                        setIsLoading(false);
                    }
                    return;
                }

                const modified = await Promise.all(
                    pdfFiles.map(async (file) => {
                        try {
                            // Fetch the original PDF
                            const existingPdfBytes = await fetch(file.url).then((res) =>
                                res.arrayBuffer()
                            );

                            if (!isMounted) {
                                return null;
                            }

                            // Load the PDF
                            const pdfDoc = await PDFDocument.load(existingPdfBytes);
                            const pages = pdfDoc.getPages();

                            // Add headers, footers, and highlights to each page
                            pages.forEach((page, index) => {
                                const { width, height } = page.getSize();
                                const pageNumber = index + 1;
                                const totalPages = pages.length;

                                // Header left
                                if (headerLeft) {
                                    const headerText =
                                        typeof headerLeft === "string"
                                            ? headerLeft
                                            : headerLeft.text || "";

                                    if (headerText) {
                                        page.drawText(headerText, {
                                            x: 50,
                                            y: height - 25,
                                            size: 10,
                                            color: rgb(0.4, 0.4, 0.4),
                                        });
                                    }
                                }

                                // Header right
                                if (headerRight) {
                                    const headerText =
                                        typeof headerRight === "string"
                                            ? headerRight
                                            : headerRight.text || "";

                                    if (headerText) {
                                        page.drawText(headerText, {
                                            x: width - 120,
                                            y: height - 25,
                                            size: 10,
                                            color: rgb(0.4, 0.4, 0.4),
                                        });
                                    }
                                }

                                // Footer text
                                if (footer) {
                                    const footerText =
                                        typeof footer === "string" ? footer : footer.text || "";

                                    if (footerText) {
                                        page.drawText(footerText, {
                                            x: 50,
                                            y: 25,
                                            size: 10,
                                            color: rgb(0.4, 0.4, 0.4),
                                        });
                                    }
                                }

                                // Page number
                                page.drawText(`Page ${pageNumber} of ${totalPages}`, {
                                    x: width - 120,
                                    y: 25,
                                    size: 10,
                                    color: rgb(0.4, 0.4, 0.4),
                                });
                            });

                            // Save the modified PDF
                            const pdfBytes = await pdfDoc.save();
                            const blob = new Blob([pdfBytes], { type: "application/pdf" });
                            const url = URL.createObjectURL(blob);

                            generatedUrls.push(url);

                            console.log(`✅ Generated modified PDF for ${file.name}`);

                            return {
                                id: file.id,
                                name: file.name,
                                type: "file" as const,
                                url,
                                originalUrl: file.url,
                            };
                        } catch (err) {
                            console.error(`❌ Error modifying ${file.name}:`, err);
                            return null;
                        }
                    })
                );

                if (isMounted) {
                    const validFiles = modified.filter((f) => f !== null);
                    setModifiedFiles(validFiles);
                    setIsLoading(false);
                    console.log(`✅ Generated ${validFiles.length} modified PDFs`);
                }
            } catch (err) {
                console.error("❌ Error generating modified PDFs:", err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Unknown error");
                    setIsLoading(false);
                }
            }
        };

        generateModifiedPDFs();

        // Cleanup function
        return () => {
            isMounted = false;
            // Revoke all generated blob URLs to free memory
            generatedUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [tree.children, headerLeft, headerRight, footer]);

    return { modifiedFiles, isLoading, error };
}
