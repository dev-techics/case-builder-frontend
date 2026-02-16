// src/features/editor/components/IndexDocument.tsx
import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Document, Page } from 'react-pdf';
import { useAppSelector } from '@/app/hooks';

interface IndexDocumentProps {
  indexUrl: string;
  onPageMetrics?: (metrics: { fileId: string; width: number }) => void;
}

const IndexDocument = memo(
  ({ indexUrl, onPageMetrics }: IndexDocumentProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const maxWidthReportedRef = useRef<number>(0);
  const scale = useAppSelector(state => state.editor.scale);

  // Get authentication token
  const token = localStorage.getItem('access_token');

  // Memoized file configuration
  const fileConfig = useMemo(
    () => ({
      url: indexUrl,
      httpHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      withCredentials: true,
    }),
    [indexUrl, token]
  );

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log(`📋 Index loaded - ${numPages} page(s)`);
  };

  const handlePageLoadSuccess = (page: any) => {
    if (!onPageMetrics) {
      return;
    }

    const viewport = page.getViewport({ scale: 1 });
    if (viewport.width > maxWidthReportedRef.current) {
      maxWidthReportedRef.current = viewport.width;
      onPageMetrics({ fileId: 'index', width: viewport.width });
    }
  };

  // Handle index link clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if clicked element is a link in the PDF
      if (target.tagName === 'A' && target.hasAttribute('data-page-number')) {
        e.preventDefault();

        const pageNumber = target.getAttribute('data-page-number');
        console.log('🔗 Index link clicked - navigating to page:', pageNumber);

        // Find the target page in the main viewer
        const targetPage = document.querySelector(
          `[data-page-number="${pageNumber}"]`
        );

        if (targetPage) {
          targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    // Add click listener to index pages
    pageRefs.current.forEach(pageElement => {
      pageElement.addEventListener('click', handleLinkClick);
    });

    return () => {
      pageRefs.current.forEach(pageElement => {
        pageElement.removeEventListener('click', handleLinkClick);
      });
    };
  }, [numPages]);

  return (
    <div className="relative flex flex-col items-center p-4">
      <Document
        file={fileConfig}
        loading={
          <div className="flex h-200 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
              <p className="text-gray-500">Loading Table of Contents...</p>
            </div>
          </div>
        }
        onLoadError={error => {
          console.error('Index PDF load error:', error);
        }}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        {Array.from(new Array(numPages), (_, index) => {
          const pageNumber = index + 1;
          return (
            <div
              className="relative mb-4"
              data-index-page={pageNumber}
              key={`index_page_${pageNumber}`}
              ref={el => {
                if (el) {
                  pageRefs.current.set(pageNumber, el);
                }
              }}
            >
              <Page
                className="shadow-md"
                pageNumber={pageNumber}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                scale={scale}
                onLoadSuccess={handlePageLoadSuccess}
              />
            </div>
          );
        })}
      </Document>
    </div>
  );
});

IndexDocument.displayName = 'IndexDocument';

export default IndexDocument;
