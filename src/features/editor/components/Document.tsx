// src/features/editor/components/Document.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Document as ReactPdfDocument, Page } from 'react-pdf';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useRotateDocumentPageMutation } from '@/features/editor/api';
import { setDocumentPageCount } from '@/features/properties-panel/redux/propertiesPanelSlice';
import AnnotationLayer from './AnnotationLayer';
import PageRotationControls from './PageRotationControls';
import type {
  DocumentPageMetrics,
  TextHighlightableDocumentProps,
} from '../types/types';
import { useDocumentMouseUp, useDocumentPages } from '@/features/editor/hooks';

const ROTATION_STEP_DEGREES = 90;

type LoadedPdfPage = {
  pageNumber: number;
  getViewport: (options: { scale: number; rotation?: number }) => {
    width: number;
    height: number;
  };
};

const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

const buildPageMetrics = (
  page: LoadedPdfPage,
  rotation: number
): DocumentPageMetrics => {
  const viewport = page.getViewport({ scale: 1, rotation });

  return {
    pageNumber: page.pageNumber,
    width: viewport.width,
    height: viewport.height,
  };
};

const hasMetricsChanged = (
  currentMetrics: DocumentPageMetrics | undefined,
  nextMetrics: DocumentPageMetrics
) =>
  currentMetrics?.width !== nextMetrics.width ||
  currentMetrics?.height !== nextMetrics.height;

const logRotatePageError = (error: unknown) => {
  console.warn(
    'Rotate page API call failed. Local page rotation remains applied.',
    error
  );
};

const PDFDocument = ({
  file,
  bundleId,
  rotation: documentRotation = 0,
  onPageMetrics,
}: TextHighlightableDocumentProps) => {
  const [documentUrlOverride, setDocumentUrlOverride] = useState<
    string | undefined
  >();
  const [pageInfo, setPageInfo] = useState<Map<number, DocumentPageMetrics>>(
    new Map()
  );
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const loadedPagesRef = useRef<Map<number, LoadedPdfPage>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const [rotateDocumentPage] = useRotateDocumentPageMutation();
  const scale = useAppSelector(states => states.editor.scale);
  const activeTool = useAppSelector(states => states.toolbar.activeTool);
  const { pages, rotatePage, settlePageRotation, syncPages } =
    useDocumentPages();

  const pagesByNumber = useMemo(
    () => new Map(pages.map(page => [page.pageNumber, page])),
    [pages]
  );

  const handleMouseUp = useDocumentMouseUp({
    fileId: file.id,
    fileName: file.name,
    pageInfo,
    pageRefs,
    containerRef,
    scale,
    activeTool,
  });

  const documentUrl = documentUrlOverride ?? file.url;

  const fileConfig = useMemo(() => {
    if (!documentUrl) {
      return undefined;
    }

    const token = localStorage.getItem('access_token');

    return {
      url: documentUrl,
      httpHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    };
  }, [documentUrl]);

  useEffect(() => {
    setPageInfo(previousPageInfo => {
      const nextPageInfo = new Map(previousPageInfo);
      let hasChanges = false;

      pages.forEach(page => {
        if (page.deleted) {
          return;
        }

        const loadedPage = loadedPagesRef.current.get(page.pageNumber);

        if (!loadedPage) {
          return;
        }

        const nextMetrics = buildPageMetrics(
          loadedPage,
          normalizeRotation(documentRotation + page.rotation)
        );

        if (
          hasMetricsChanged(previousPageInfo.get(page.pageNumber), nextMetrics)
        ) {
          nextPageInfo.set(page.pageNumber, nextMetrics);
          hasChanges = true;
        }
      });

      return hasChanges ? nextPageInfo : previousPageInfo;
    });
  }, [documentRotation, pages]);

  useEffect(() => {
    if (!onPageMetrics || pageInfo.size === 0) {
      return;
    }

    let maxWidth = 0;
    pageInfo.forEach(metrics => {
      if (metrics.width > maxWidth) {
        maxWidth = metrics.width;
      }
    });

    if (maxWidth > 0) {
      onPageMetrics({ fileId: file.id, width: maxWidth });
    }
  }, [file.id, onPageMetrics, pageInfo]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    syncPages(numPages);

    dispatch(
      setDocumentPageCount({
        fileId: file.id,
        numPages,
        fileName: file.name,
      })
    );
  };

  const onPageLoadSuccess = (pageNumber: number) => (page: LoadedPdfPage) => {
    loadedPagesRef.current.set(pageNumber, page);

    const nextMetrics = buildPageMetrics(
      page,
      normalizeRotation(
        documentRotation + (pagesByNumber.get(pageNumber)?.rotation ?? 0)
      )
    );

    setPageInfo(previousPageInfo => {
      if (!hasMetricsChanged(previousPageInfo.get(pageNumber), nextMetrics)) {
        return previousPageInfo;
      }

      const nextPageInfo = new Map(previousPageInfo);
      nextPageInfo.set(pageNumber, nextMetrics);
      return nextPageInfo;
    });
  };

  const persistPageRotation = (
    pageNumber: number,
    rotation: number,
    delta: number
  ) => {
    if (!bundleId) {
      return;
    }

    rotateDocumentPage({
      bundleId,
      documentId: file.id,
      pageNumber,
      rotation,
    })
      .unwrap()
      .then(response => {
        if (!response.documentUrl) {
          return;
        }

        loadedPagesRef.current = new Map();
        setPageInfo(new Map());
        setDocumentUrlOverride(response.documentUrl);
        settlePageRotation(pageNumber, delta);
      })
      .catch(logRotatePageError);
  };

  const handleRotatePage = (pageNumber: number, delta: number) => {
    rotatePage(pageNumber, delta);

    const loadedPage = loadedPagesRef.current.get(pageNumber);
    const currentPageRotation = pagesByNumber.get(pageNumber)?.rotation ?? 0;
    const nextPageRotation = normalizeRotation(currentPageRotation + delta);

    if (!loadedPage) {
      persistPageRotation(pageNumber, nextPageRotation, delta);
      return;
    }

    const nextMetrics = buildPageMetrics(
      loadedPage,
      normalizeRotation(documentRotation + nextPageRotation)
    );

    setPageInfo(previousPageInfo => {
      if (!hasMetricsChanged(previousPageInfo.get(pageNumber), nextMetrics)) {
        return previousPageInfo;
      }

      const nextPageInfo = new Map(previousPageInfo);
      nextPageInfo.set(pageNumber, nextMetrics);
      return nextPageInfo;
    });

    persistPageRotation(pageNumber, nextPageRotation, delta);
  };

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
      <ReactPdfDocument
        key={`${file.id}-${documentUrl ?? ''}`}
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
        {pages
          .filter(page => !page.deleted)
          .map(page => {
            const pageNumber = page.pageNumber;
            const pageData = pageInfo.get(pageNumber);
            const resolvedRotation = normalizeRotation(
              documentRotation + page.rotation
            );

            return (
              <div
                className="relative mb-4"
                data-file-id={file.id}
                data-page-number={pageNumber}
                key={`page_${pageNumber}`}
                ref={element => {
                  if (element) {
                    pageRefs.current.set(pageNumber, element);
                  } else {
                    pageRefs.current.delete(pageNumber);
                  }
                }}
              >
                {/* Page actions stay next to each page for page-specific controls. */}
                <PageRotationControls
                  pageNumber={pageNumber}
                  rotation={resolvedRotation}
                  onRotateLeft={() =>
                    handleRotatePage(pageNumber, -ROTATION_STEP_DEGREES)
                  }
                  onRotateRight={() =>
                    handleRotatePage(pageNumber, ROTATION_STEP_DEGREES)
                  }
                />

                <Page
                  className="shadow-md"
                  pageNumber={pageNumber}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  rotate={resolvedRotation}
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
      </ReactPdfDocument>
    </div>
  );
};

export default PDFDocument;
