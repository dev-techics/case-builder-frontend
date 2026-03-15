// src/features/editor/components/Document.tsx
import { useMemo, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setDocumentPageCount } from '@/features/properties-panel/redux/propertiesPanelSlice';
import AnnotationLayer from './AnnotationLayer';
import type { TextHighlightableDocumentProps } from '../types/types';
import { useDocumentMouseUp } from '@/features/editor/hooks';

const PDFDocument = ({
  file,
  rotation = 0,
  onPageMetrics,
}: TextHighlightableDocumentProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageInfo, setPageInfo] = useState<Map<number, any>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const maxWidthReportedRef = useRef<number>(0);
  const dispatch = useAppDispatch();
  const scale = useAppSelector(states => states.editor.scale);
  const activeTool = useAppSelector(states => states.toolbar.activeTool);

  // handle mouse up handler
  const handleMouseUp = useDocumentMouseUp({
    fileId: file.id,
    fileName: file.name,
    pageInfo,
    pageRefs,
    containerRef,
    scale,
    activeTool,
  });

  // Memoize the file configuration - ONLY depends on file.url
  const fileConfig = useMemo(() => {
    if (!file.url) {
      return undefined;
    }

    const token = localStorage.getItem('access_token');

    return {
      url: file.url,
      httpHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    };
  }, [file.url]);

  /* Document page count handler */
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);

    dispatch(
      setDocumentPageCount({
        fileId: file.id,
        numPages,
        fileName: file.name,
      })
    );
    console.log(`✅ PDF loaded: ${file.name} - ${numPages} pages`);
  };

  /**
   * Handle page load to get page dimensions
   */
  const onPageLoadSuccess = (pageNumber: number) => (page: any) => {
    const viewport = page.getViewport({ scale: 1, rotation });

    setPageInfo(prev => {
      const newMap = new Map(prev);
      newMap.set(pageNumber, {
        width: viewport.width,
        height: viewport.height,
        pageNumber,
      });
      return newMap;
    });

    if (onPageMetrics && viewport.width > maxWidthReportedRef.current) {
      maxWidthReportedRef.current = viewport.width;
      onPageMetrics({ fileId: file.id, width: viewport.width });
    }
  };

  // If no file URL, show error state
  if (!fileConfig) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">No PDF URL available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" onMouseUp={handleMouseUp} ref={containerRef}>
      <Document
        file={fileConfig}
        loading={
          <div className="flex h-200 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
              <p className="text-gray-500">Loading PDF...</p>
            </div>
          </div>
        }
        onLoadError={error => {
          console.error('PDF load error:', error);
        }}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        {Array.from(new Array(numPages), (_, index) => {
          const pageNumber = index + 1;
          const pageData = pageInfo.get(pageNumber);
          return (
            <div
              className="relative mb-4"
              data-file-id={file.id}
              data-page-number={pageNumber}
              key={`page_${pageNumber}`}
              ref={el => {
                if (el) {
                  pageRefs.current.set(pageNumber, el);
                }
              }}
            >
              {/* PDF Page */}
              <Page
                className="shadow-md"
                pageNumber={pageNumber}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                rotate={rotation}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess(pageNumber)}
              />

              <AnnotationLayer
                fileId={file.id}
                pageInfo={pageData}
                pageNumber={pageNumber}
                scale={scale}
              />
            </div>
          );
        })}
      </Document>
    </div>
  );
};

export default PDFDocument;
