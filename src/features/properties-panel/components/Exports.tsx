// features/properties-panel/components/Exports.tsx
import { AlertCircle, CheckCircle, Download, FileStack } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import type { Children } from '@/features/file-explorer/redux/fileTreeSlice';
import axiosInstance from '@/api/axiosInstance';

/**
 * Recursively collects all PDF files from the tree structure
 */
const collectAllFiles = (children: Children[]): Children[] => {
  const files: Children[] = [];

  for (const child of children) {
    if (child.type === 'file' && child.url) {
      files.push(child);
    } else if (child.type === 'folder' && child.children) {
      const nestedFiles = collectAllFiles(child.children);
      files.push(...nestedFiles);
    }
  }

  return files;
};

/**
 * Fetch PDF with authentication
 * @param url - The PDF URL
 * @param original - If true, fetches the original PDF without headers/footers
 */
const fetchAuthenticatedPdf = async (
  url: string,
  original: boolean = true
): Promise<ArrayBuffer> => {
  // Extract path from full URL if needed
  let fetchUrl = url;
  if (url.startsWith('http')) {
    const urlObj = new URL(url);
    fetchUrl = urlObj.pathname;
  }

  // Add original parameter if requested
  if (original) {
    const separator = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${separator}original=true`;
  }

  console.log(
    '🔄 Fetching PDF:',
    fetchUrl,
    original ? '(ORIGINAL)' : '(MODIFIED)'
  );

  try {
    const response = await axiosInstance.get(fetchUrl, {
      responseType: 'arraybuffer',
      validateStatus: status => status === 200,
    });

    // Verify it's a PDF
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(
        `Invalid content type: ${contentType}. Expected application/pdf.`
      );
    }

    // Verify PDF header
    const firstBytes = new Uint8Array(response.data).slice(0, 4);
    const pdfHeader = String.fromCharCode(...firstBytes);

    if (!pdfHeader.startsWith('%PDF')) {
      throw new Error('Invalid PDF data - missing PDF header');
    }

    console.log(
      '✅ PDF fetched successfully',
      original ? '(ORIGINAL)' : '(MODIFIED)'
    );
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch PDF:', error);

    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (status === 403) {
        throw new Error('Permission denied for this file.');
      } else if (status === 404) {
        throw new Error('File not found on server.');
      }
    }

    throw new Error(error.message || 'Failed to fetch PDF');
  }
};

function Exports() {
  const tree = useAppSelector(states => states.fileTree.tree);
  const { headerLeft, headerRight, footer } = useAppSelector(
    states => states.propertiesPanel.headersFooter
  );

  // Get highlights from toolbar slice
  const highlights = useAppSelector(state => state.toolbar.highlights);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'exporting' | 'success' | 'error'
  >('idle');
  const [exportMessage, setExportMessage] = useState('');
  const [includeIndex, setIncludeIndex] = useState(true);

  // Recursively collect all PDF files from the entire tree
  const pdfFiles = collectAllFiles(tree.children);
  const hasFiles = pdfFiles.length > 0;

  const handleExport = async () => {
    if (!hasFiles) {
      setExportStatus('error');
      setExportMessage('No PDF files to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('exporting');
    setExportMessage('Processing your files...');

    try {
      const pdfDoc = await PDFDocument.create();

      // Add index as first page if enabled and URL exists
      if (includeIndex && tree.indexUrl) {
        try {
          setExportMessage('Adding index page...');
          const indexPdfBytes = await fetchAuthenticatedPdf(tree.indexUrl);
          const indexPdf = await PDFDocument.load(indexPdfBytes);
          const indexPages = await pdfDoc.copyPages(
            indexPdf,
            indexPdf.getPageIndices()
          );
          indexPages.forEach(page => {
            pdfDoc.addPage(page);
          });
          console.log('✅ Index page added from URL');
        } catch (error) {
          console.error('Error adding index from URL:', error);
          // Continue without index if there's an error
        }
      }

      // Add all PDF files with authentication
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];

        if (!file.url) {
          console.warn(`File ${file.name} has no URL, skipping`);
          continue;
        }

        setExportMessage(
          `Adding ${file.name}... (${i + 1}/${pdfFiles.length})`
        );

        try {
          // Fetch with authentication
          const existingPdfBytes = await fetchAuthenticatedPdf(file.url);

          // Load and copy pages
          const loadedPdf = await PDFDocument.load(existingPdfBytes);
          const copiedPages = await pdfDoc.copyPages(
            loadedPdf,
            loadedPdf.getPageIndices()
          );

          copiedPages.forEach(page => {
            pdfDoc.addPage(page);
          });

          console.log(`✅ Added ${file.name} (${copiedPages.length} pages)`);
        } catch (error: any) {
          console.error(`Failed to add ${file.name}:`, error);
          throw new Error(`Failed to add ${file.name}: ${error.message}`);
        }
      }

      setExportMessage('Adding headers, footers, and highlights...');

      // Track page index mapping (for highlights)
      let globalPageIndex = 0;
      const filePageMapping: {
        [fileId: string]: { start: number; end: number };
      } = {};

      // Calculate page mapping for each file
      if (includeIndex && tree.indexUrl) {
        globalPageIndex = 1; // Index takes page 0
      }

      for (const file of pdfFiles) {
        if (!file.url) continue;

        try {
          const pdfBytes = await fetchAuthenticatedPdf(file.url);
          const tempPdf = await PDFDocument.load(pdfBytes);
          const pageCount = tempPdf.getPageCount();

          filePageMapping[file.id] = {
            start: globalPageIndex,
            end: globalPageIndex + pageCount - 1,
          };

          globalPageIndex += pageCount;
        } catch (error) {
          console.error(`Failed to map pages for ${file.name}:`, error);
        }
      }

      // Add headers/footers/highlights to all pages
      const pages = pdfDoc.getPages();
      pages.forEach((page, pageIndex) => {
        const { width, height } = page.getSize();
        const pageNumber = pageIndex + 1;

        // Find which file this page belongs to
        let currentFileId: string | null = null;
        let relativePageNumber = 0;

        for (const [fileId, mapping] of Object.entries(filePageMapping)) {
          if (pageIndex >= mapping.start && pageIndex <= mapping.end) {
            currentFileId = fileId;
            relativePageNumber = pageIndex - mapping.start + 1;
            break;
          }
        }

        /*-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
           Draw highlights for this page 
          -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
        if (currentFileId) {
          const pageHighlights = highlights.filter(
            h =>
              h.fileId === currentFileId && h.pageNumber === relativePageNumber
          );

          pageHighlights.forEach(highlight => {
            try {
              // Draw semi-transparent rectangle for highlight
              page.drawRectangle({
                x: highlight.coordinates.x,
                y: highlight.coordinates.y, // PDF coordinates start from bottom
                width: highlight.coordinates.width,
                height: highlight.coordinates.height,
                color: rgb(
                  highlight.color.rgb.r,
                  highlight.color.rgb.g,
                  highlight.color.rgb.b
                ),
                opacity: 0.3,
              });
            } catch (error) {
              console.error('Failed to draw highlight:', error);
            }
          });
        }

        // Header left
        if (headerLeft) {
          const headerText =
            typeof headerLeft === 'string' ? headerLeft : headerLeft.text || '';

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
            typeof headerRight === 'string'
              ? headerRight
              : headerRight.text || '';

          if (headerText) {
            page.drawText(headerText, {
              x: width - 120,
              y: height - 25,
              size: 10,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }

        // Footer
        if (footer) {
          const footerText =
            typeof footer === 'string' ? footer : footer.text || '';

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
        page.drawText(`Page ${pageNumber} of ${pages.length}`, {
          x: width - 120,
          y: 25,
          size: 10,
          color: rgb(0.4, 0.4, 0.4),
        });
      });

      setExportMessage('Finalizing PDF...');

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tree.projectName || 'Project'}_${new Date().getTime()}.pdf`;
      link.click();

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setExportStatus('success');
      setExportMessage(
        `Successfully exported ${pages.length} pages from ${pdfFiles.length} files${
          includeIndex && tree.indexUrl ? ' (including index)' : ''
        }`
      );

      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error exporting PDFs:', error);
      setExportStatus('error');
      setExportMessage(
        error instanceof Error ? error.message : 'Failed to export PDFs'
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
            <div className="mt-2 max-h-32 overflow-y-auto text-gray-500">
              {pdfFiles.map(f => (
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
              onChange={e => setIncludeIndex(e.target.checked)}
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
      {exportStatus === 'success' && (
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

      {exportStatus === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900 text-xs">Export failed</p>
            <p className="mt-0.5 text-red-700 text-xs">{exportMessage}</p>
          </div>
        </div>
      )}

      {exportStatus === 'exporting' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="font-semibold text-blue-900 text-xs">{exportMessage}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-1/3 animate-pulse bg-blue-500" />
          </div>
        </div>
      )}

      {/* Export Button */}
      <Button
        className="w-full"
        disabled={!hasFiles || isExporting}
        onClick={handleExport}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? 'Exporting...' : 'Export All'}
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
