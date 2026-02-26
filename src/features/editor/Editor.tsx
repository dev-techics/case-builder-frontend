// src/features/editor/Editor.tsx
import { FileText, ArrowUp } from 'lucide-react';
import type React from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import PDFDocument from './components/Document';
import UploadFile from './components/UploadFile';
import { loadComments } from '../toolbar/redux';
import { DocumentApiService } from '@/api/axiosInstance';
import {
  clearDocumentInfo,
  loadMetadataFromBackend,
  setCurrentBundleId,
} from '../properties-panel/redux/propertiesPanelSlice';
import { selectFile } from '../file-explorer/redux/fileTreeSlice';
import { useParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Fallback from '@/components/Fallback';
import IndexPreview from './components/IndexPreview';
import PdfHeader from './components/PdfHeader';
import AnnotationToolbar from '@/features/toolbar/AnnotationToolbar';
import {
  setMaxScale,
  setScale,
  zoomIn,
  zoomOut,
} from './redux/editorSlice';

// Component that only renders PDF when visible
const LazyPDFRenderer: React.FC<{
  file: any;
  onVisible?: () => void;
  onPageMetrics?: (metrics: { fileId: string; width: number }) => void;
}> = ({ file, onVisible, onPageMetrics }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          onVisible?.();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, onVisible]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center p-4 min-h-[600px]"
    >
      {isVisible ? (
        <ErrorBoundary FallbackComponent={Fallback} resetKeys={[file.url]}>
          <PDFDocument file={file} onPageMetrics={onPageMetrics} />
        </ErrorBoundary>
      ) : (
        <div className="flex h-96 w-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <p className="text-gray-400 text-sm">Scroll to load PDF...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const SCROLL_THRESHOLD_PX = 240;
const LOAD_COOLDOWN_MS = 400;
const PDF_CONTAINER_HORIZONTAL_PADDING = 32;
const DEFAULT_MAX_SCALE = 3.0;
const SCROLL_TOP_SHOW_THRESHOLD = 300;

const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const bundleId = useParams().bundleId;
  const scale = useAppSelector(state => state.editor.scale);
  const maxScale = useAppSelector(state => state.editor.maxScale);

  // State for loaded files (infinite scroll)
  const [visibleRange, setVisibleRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [loadingDirection, setLoadingDirection] = useState<
    'prev' | 'next' | null
  >(null);
  const [maxBaseWidth, setMaxBaseWidth] = useState<number | null>(null);
  const [contentWidth, setContentWidth] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const loadingDirectionRef = useRef<'prev' | 'next' | null>(null);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const pageWidthsRef = useRef<Map<string, number>>(new Map());

  const handleScrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePageMetrics = useCallback(
    ({ fileId, width }: { fileId: string; width: number }) => {
      if (!width) {
        return;
      }

      const existingWidth = pageWidthsRef.current.get(fileId) ?? 0;
      if (width <= existingWidth) {
        return;
      }

      pageWidthsRef.current.set(fileId, width);

      let maxWidth = 0;
      pageWidthsRef.current.forEach(value => {
        if (value > maxWidth) {
          maxWidth = value;
        }
      });

      setMaxBaseWidth(maxWidth || null);
    },
    []
  );

  useEffect(() => {
    pageWidthsRef.current.clear();
    setMaxBaseWidth(null);
    dispatch(setScale(1));
  }, [bundleId, dispatch]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return;
    }

    const updateWidth = () => {
      const styles = window.getComputedStyle(content);
      const padding =
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const width = Math.max(0, container.clientWidth - padding);
      setContentWidth(width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const availableWidth = useMemo(
    () => Math.max(0, contentWidth - PDF_CONTAINER_HORIZONTAL_PADDING),
    [contentWidth]
  );

  const computedMaxScale = useMemo(() => {
    if (!maxBaseWidth || availableWidth === 0) {
      return DEFAULT_MAX_SCALE;
    }
    return Math.min(DEFAULT_MAX_SCALE, availableWidth / maxBaseWidth);
  }, [availableWidth, maxBaseWidth]);

  const scaledDocumentWidth = useMemo(() => {
    if (!maxBaseWidth) {
      return null;
    }
    return Math.ceil(maxBaseWidth * scale + PDF_CONTAINER_HORIZONTAL_PADDING);
  }, [maxBaseWidth, scale]);

  const contentStyle = useMemo<React.CSSProperties | undefined>(() => {
    const baseWidth = contentWidth > 0 ? contentWidth : 0;
    const targetWidth =
      scaledDocumentWidth && baseWidth
        ? Math.max(scaledDocumentWidth, baseWidth)
        : scaledDocumentWidth ?? (baseWidth || null);

    if (!targetWidth) {
      return undefined;
    }

    return { width: `${Math.ceil(targetWidth)}px` };
  }, [contentWidth, scaledDocumentWidth]);

  useEffect(() => {
    if (!Number.isFinite(computedMaxScale)) {
      return;
    }
    dispatch(setMaxScale(computedMaxScale));
  }, [computedMaxScale, dispatch]);

  const canZoomIn = scale < maxScale - 0.01;
  const canZoomOut = scale > 0.5 + 0.01;
  const canResetZoom = Math.abs(scale - 1) > 0.01;

  const handleZoomIn = useCallback(() => {
    dispatch(zoomIn());
  }, [dispatch]);

  const handleZoomOut = useCallback(() => {
    dispatch(zoomOut());
  }, [dispatch]);

  const handleResetZoom = useCallback(() => {
    dispatch(setScale(1));
  }, [dispatch]);

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Index preview is rendered locally from tree data
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/

  /* Load comments for the current bundle */
  useEffect(() => {
    if (bundleId) {
      dispatch(loadComments({ bundleId: bundleId }));
    }
  }, [dispatch, bundleId]);

  useEffect(() => {
    if (bundleId) {
      dispatch(clearDocumentInfo());
    }
  }, [bundleId, dispatch]);

  useEffect(() => {
    const bundleId = tree.id.split('-')[1];
    if (bundleId) {
      dispatch(setCurrentBundleId(bundleId));
      dispatch(loadMetadataFromBackend(bundleId));
    }
  }, [tree.id, dispatch]);

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Get all files from tree (flatten the tree structure)
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  const getAllFiles = useCallback((children: any[]): any[] => {
    const files: any[] = [];
    const traverse = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          files.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(children);
    return files;
  }, []);

  const allFiles = useMemo(
    () => getAllFiles(tree.children),
    [tree.children, getAllFiles]
  );

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Ensure selected file is a valid file (not a folder)
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  useEffect(() => {
    if (allFiles.length === 0) {
      if (selectedFile !== null) {
        dispatch(selectFile(null));
      }
      return;
    }

    const selectedIsFile = selectedFile
      ? allFiles.some(file => file.id === selectedFile)
      : false;

    if (!selectedIsFile) {
      dispatch(selectFile(allFiles[0].id));
    }
  }, [allFiles, selectedFile, dispatch]);

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Initialize visible range for selected file
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  useEffect(() => {
    if (!selectedFile || allFiles.length === 0) {
      setVisibleRange(null);
      setLoadingDirection(null);
      loadingDirectionRef.current = null;
      lastLoadTimeRef.current = 0;
      pendingScrollAdjustRef.current = null;
      return;
    }

    const selectedIndex = allFiles.findIndex(file => file.id === selectedFile);
    if (selectedIndex === -1) {
      return;
    }

    setVisibleRange({ start: selectedIndex, end: selectedIndex });
    setLoadingDirection(null);
    loadingDirectionRef.current = null;
    lastLoadTimeRef.current = 0;
    pendingScrollAdjustRef.current = null;

    if (containerRef.current) {
      lastScrollTopRef.current = containerRef.current.scrollTop;
    }

    console.log(
      `🎯 Selected file changed to: ${allFiles.find(f => f.id === selectedFile)?.name}`
    );
  }, [selectedFile, allFiles]);

  const requestLoadNext = useCallback(() => {
    if (!visibleRange || allFiles.length === 0) {
      return;
    }

    if (loadingDirectionRef.current) {
      return;
    }

    if (visibleRange.end >= allFiles.length - 1) {
      return;
    }

    const now = Date.now();
    if (now - lastLoadTimeRef.current < LOAD_COOLDOWN_MS) {
      return;
    }

    lastLoadTimeRef.current = now;
    loadingDirectionRef.current = 'next';
    setLoadingDirection('next');

    setVisibleRange(prev => {
      if (!prev || prev.end >= allFiles.length - 1) {
        return prev;
      }
      return { start: prev.start, end: prev.end + 1 };
    });
  }, [allFiles.length, visibleRange]);

  const requestLoadPrev = useCallback(() => {
    if (!visibleRange || allFiles.length === 0) {
      return;
    }

    if (loadingDirectionRef.current) {
      return;
    }

    if (visibleRange.start <= 0) {
      return;
    }

    const now = Date.now();
    if (now - lastLoadTimeRef.current < LOAD_COOLDOWN_MS) {
      return;
    }

    lastLoadTimeRef.current = now;

    if (containerRef.current) {
      pendingScrollAdjustRef.current = containerRef.current.scrollHeight;
    }

    loadingDirectionRef.current = 'prev';
    setLoadingDirection('prev');

    setVisibleRange(prev => {
      if (!prev || prev.start <= 0) {
        return prev;
      }
      return { start: prev.start - 1, end: prev.end };
    });
  }, [allFiles.length, visibleRange]);

  useEffect(() => {
    if (!loadingDirectionRef.current) {
      return;
    }

    const id = window.setTimeout(() => {
      loadingDirectionRef.current = null;
      setLoadingDirection(null);
    }, 0);

    return () => window.clearTimeout(id);
  }, [visibleRange]);

  useLayoutEffect(() => {
    const previousHeight = pendingScrollAdjustRef.current;
    const container = containerRef.current;

    if (previousHeight === null || !container) {
      return;
    }

    const newHeight = container.scrollHeight;
    const delta = newHeight - previousHeight;

    if (delta > 0) {
      container.scrollTop += delta;
    }

    lastScrollTopRef.current = container.scrollTop;
    pendingScrollAdjustRef.current = null;
  }, [visibleRange]);

  // Get visible files with their data
  const visibleFiles = useMemo(() => {
    if (!visibleRange) {
      return [];
    }
    return allFiles.slice(visibleRange.start, visibleRange.end + 1);
  }, [visibleRange, allFiles]);

  // Create files with URLs (always stream the original PDF)
  const filesWithUrls = useMemo(() => {
    return visibleFiles.map(file => ({
      ...file,
      url: `${DocumentApiService.getDocumentStreamUrl(file.id)}?original=true`,
    }));
  }, [visibleFiles]);

  const hasPreviousFiles = visibleRange ? visibleRange.start > 0 : false;
  const hasNextFiles = visibleRange
    ? visibleRange.end < allFiles.length - 1
    : false;

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !visibleRange) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop === lastScrollTopRef.current) {
      return;
    }

    const direction =
      scrollTop > lastScrollTopRef.current ? 'down' : 'up';
    lastScrollTopRef.current = scrollTop;

    // Show/hide scroll-to-top button
    setShowScrollTop(scrollTop > SCROLL_TOP_SHOW_THRESHOLD);

    const nearTop = scrollTop <= SCROLL_THRESHOLD_PX;
    const nearBottom =
      scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD_PX;

    if (direction === 'down' && nearBottom && hasNextFiles) {
      requestLoadNext();
    }

    if (direction === 'up' && nearTop && hasPreviousFiles) {
      requestLoadPrev();
    }
  }, [hasNextFiles, hasPreviousFiles, requestLoadNext, requestLoadPrev, visibleRange]);

  const hasFiles = allFiles.length > 0;
  const shouldShowIndex = hasFiles && !hasPreviousFiles;

  /*----------------------------
      Empty State
  ------------------------------*/
  if (!hasFiles) {
    return <UploadFile />;
  }

  // No file selected
  if (hasFiles && filesWithUrls.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-gray-600 text-xl font-medium">
            Select a PDF to view
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            Choose a file from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* PDF Document Viewer Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="pdf-viewer-container flex-1 overflow-x-auto overflow-y-auto bg-gray-100"
      >
        <div className="sticky top-0 z-30">
          <AnnotationToolbar />
        </div>

        <div
          ref={contentRef}
          className="mx-auto max-w-none space-y-8 p-8 box-content"
          style={contentStyle}
        >
          {/* INDEX PAGE - Only show when at the beginning of the list */}
          {shouldShowIndex && (
            <div className="rounded-lg bg-white shadow-lg">
              {/* Index Content */}
              <ErrorBoundary FallbackComponent={Fallback}>
                <IndexPreview />
              </ErrorBoundary>
            </div>
          )}

          {/* Load Previous Files */}
          {hasPreviousFiles && (
            <div className="flex h-24 items-center justify-center">
              {loadingDirection === 'prev' ? (
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-blue-500" />
                  <div className="text-gray-500 font-medium">
                    Loading previous PDF...
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  Scroll up to load previous files
                </div>
              )}
            </div>
          )}

          {/*----------- Render all loaded files-------- */}
          {filesWithUrls.map(fileWithUrl => (
            <div
              key={fileWithUrl.id}
              className="rounded-lg bg-white shadow-lg"
              data-file-id={fileWithUrl.id}
            >
              {/* PDF Header */}
              <ErrorBoundary FallbackComponent={Fallback}>
                <PdfHeader
                  file={fileWithUrl}
                  scale={scale}
                  canZoomIn={canZoomIn}
                  canZoomOut={canZoomOut}
                  canResetZoom={canResetZoom}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                />
              </ErrorBoundary>

              {/* PDF Content Area - LAZY LOADED */}
              <LazyPDFRenderer
                file={fileWithUrl}
                onPageMetrics={handlePageMetrics}
              />
            </div>
          ))}

          {/* Load Next Files */}
          {hasNextFiles && (
            <div className="flex h-32 items-center justify-center">
              {loadingDirection === 'next' ? (
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-blue-500" />
                  <div className="text-gray-500 font-medium">
                    Loading next PDF...
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  Scroll down to load more files
                </div>
              )}
            </div>
          )}

          {/* End of files indicator */}
          {visibleFiles.length === allFiles.length &&
            visibleFiles.length > 1 && (
            <div className="flex items-center justify-center py-8">
              <div className="rounded-full bg-gray-200 px-4 py-2">
                <p className="text-gray-600 text-sm font-medium">
                  All files loaded ({visibleFiles.length} files)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button - positioned relative to the outer wrapper */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="absolute bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default PDFViewer;
