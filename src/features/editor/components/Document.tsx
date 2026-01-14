// src/features/editor/components/Document.tsx
import { useMemo, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setDocumentPageCount } from '@/features/properties-panel/propertiesPanelSlice';
import InputComment from '@/features/toolbar/components/InputComment';
import { Toolbar } from '@/features/toolbar/Toolbar';
import {
  setPendingHighlight,
  setToolbarPosition,
} from '@/features/toolbar/toolbarSlice';
import { getTextSelectionCoordinates } from '@/lib/pdfCoordinateUtils';
import CommentOverlay from '../../toolbar/components/CommentOverlay';
import { InteractiveHighlightOverlay } from '../../toolbar/components/HighlightOverlay';
import { ScreenToPdfCoordinates } from '../helpers';
import type { TextHighlightableDocumentProps } from '../types';

export function TextHighlightableDocument({
  file,
}: TextHighlightableDocumentProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageInfo, setPageInfo] = useState<Map<number, any>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const scale = useAppSelector(states => states.editor.scale);
  const fileId = useAppSelector(
    states => states.toolbar.pendingHighlight?.fileId
  );
  const CommentPosition = useAppSelector(
    states => states.toolbar.CommentPosition
  );
  const pendingHighlight = useAppSelector(
    states => states.toolbar.pendingHighlight
  );

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
    const viewport = page.getViewport({ scale: 1 });

    setPageInfo(prev => {
      const newMap = new Map(prev);
      newMap.set(pageNumber, {
        width: viewport.width,
        height: viewport.height,
        pageNumber,
      });
      return newMap;
    });
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      return;
    }

    let selectedPageNumber: number | null = null;
    let pageElement: HTMLDivElement | null = null;

    pageRefs.current.forEach((element, pageNumber) => {
      if (
        element &&
        selection.containsNode &&
        selection.containsNode(element, true)
      ) {
        selectedPageNumber = pageNumber;
        pageElement = element;
      }
    });

    if (selectedPageNumber === null || pageElement === null) {
      console.warn('⚠️ Could not determine which page was selected');
      return;
    }

    const foundPageNumber: number = selectedPageNumber;
    const foundPageElement: HTMLDivElement = pageElement;

    const pageData = pageInfo.get(foundPageNumber);

    if (!pageData) {
      console.warn('⚠️ Page info not loaded yet');
      return;
    }

    const selectionCoords = getTextSelectionCoordinates(foundPageElement);
    if (!selectionCoords) {
      return;
    }

    const pageInfoWithOffset = {
      ...pageData,
      left: 0,
      top: 0,
    };

    const pdfCoords = ScreenToPdfCoordinates(
      selectionCoords,
      pageInfoWithOffset,
      scale
    );

    console.log('📍 Selection info:', {
      fileId: file.id,
      fileName: file.name,
      pageNumber: foundPageNumber,
      text: selectionCoords.selectedText,
      pdfCoordinates: pdfCoords,
      selectionCoords,
    });

    const containerRect = containerRef.current?.getBoundingClientRect();
    const pageRect = foundPageElement.getBoundingClientRect();

    if (!containerRect) {
      console.warn('⚠️ Container ref not available');
      return;
    }

    const pickerX =
      pageRect.left -
      containerRect.left +
      selectionCoords.left +
      selectionCoords.width / 2;

    const pickerY = pageRect.top - containerRect.top + selectionCoords.top;

    dispatch(
      setPendingHighlight({
        fileId: file.id,
        pageNumber: foundPageNumber,
        coordinates: {
          x: pdfCoords.x,
          y: pdfCoords.y,
          width: pdfCoords.width,
          height: pdfCoords.height,
        },
        text: selectionCoords.selectedText,
      })
    );

    dispatch(setToolbarPosition({ x: pickerX, y: pickerY }));
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
      {file.id === fileId ? <Toolbar /> : ''}

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
                scale={scale}
                onLoadSuccess={onPageLoadSuccess(pageNumber)}
              />

              {/* Highlight Overlays */}
              {pageData && (
                <InteractiveHighlightOverlay
                  fileId={file.id}
                  pageHeight={pageData.height}
                  pageNumber={pageNumber}
                  scale={scale}
                />
              )}

              {/* Comment Overlays */}
              {pageData && (
                <CommentOverlay
                  fileId={file.id}
                  pageHeight={pageData.height}
                  pageNumber={pageNumber}
                  scale={scale}
                />
              )}
            </div>
          );
        })}
      </Document>

      {/* Comment Input */}
      {CommentPosition.x !== null &&
        CommentPosition.y !== null &&
        pendingHighlight?.fileId === file.id && <InputComment />}
    </div>
  );
}
