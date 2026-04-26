// src/features/editor/Editor.tsx
import { FileText, ArrowUp } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import UploadFile from './components/UploadFile';
import { DocumentApiService } from '@/api/axiosInstance';
import { useParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Fallback from '@/components/Fallback';
import IndexPreview from '@/features/index-preview';
import PdfHeader from './components/PdfHeader';
import AnnotationToolbar from '@/features/toolbar/AnnotationToolbar';
import LazyPDFRenderer from './components/LazyPDFRenderer';
import { setMaxScale, setScale } from './states/editorSlice';
import {
  useBundleMetadata,
  useFileRotations,
  useInfinitePdfFiles,
  usePdfSizing,
} from '@/features/editor/hooks';
import { resolveBundleId } from '@/lib/bundleId';

const PDFViewer = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const fileSelectionVersion = useAppSelector(
    state => state.fileTree.fileSelectionVersion
  );
  const { bundleId: routeBundleId } = useParams<{ bundleId?: string }>();
  const resolvedBundleId = resolveBundleId({
    routeBundleId,
    treeId: tree.id,
  });
  const scale = useAppSelector(state => state.editor.scale);

  // Refs for the scroll container and content sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Used to bust PDF stream cache when the active bundle changes.
  const streamSessionKey = resolvedBundleId ?? tree.id;

  // Bundle-scoped side effects (metadata + comments)
  useBundleMetadata({
    bundleId: resolvedBundleId ?? undefined,
    treeId: tree.id,
  });

  // Rotation state and mutation wiring
  const { fileRotations, fileUrlOverrides, resetRotations } = useFileRotations({
    bundleId: resolvedBundleId ?? '',
  });

  // Size calculations, max scale, and page metrics tracking
  const { contentStyle, computedMaxScale, handlePageMetrics, resetSizing } =
    usePdfSizing({
      containerRef,
      contentRef,
      scale,
    });

  // Infinite scroll state + visible file window
  const {
    allFiles,
    visibleFiles,
    loadingDirection,
    showScrollTop,
    handleScroll,
    handleScrollToTop,
    hasPreviousFiles,
    hasNextFiles,
  } = useInfinitePdfFiles({
    tree,
    selectedFile,
    fileSelectionVersion,
    containerRef,
  });

  // Reset view state when bundle changes
  useEffect(() => {
    resetSizing();
    resetRotations();
    dispatch(setScale(1));
  }, [dispatch, resetRotations, resetSizing, resolvedBundleId]);

  useEffect(() => {
    if (!Number.isFinite(computedMaxScale)) {
      return;
    }
    dispatch(setMaxScale(computedMaxScale));
  }, [computedMaxScale, dispatch]);

  // Prefer backend-provided document URLs and fall back to the legacy stream path.
  const filesWithUrls = useMemo(
    () =>
      visibleFiles.map(file => ({
        ...file,
        url:
          fileUrlOverrides[file.id] ??
          file.url ??
          `${DocumentApiService.getDocumentStreamUrl(file.id)}?original=true&cb=${streamSessionKey}`,
      })),
    [fileUrlOverrides, streamSessionKey, visibleFiles]
  );

  // Derived UI state
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
                  rotation={fileRotations[fileWithUrl.id] ?? 0}
                />
              </ErrorBoundary>

              {/* PDF Content Area - LAZY LOADED */}
              <LazyPDFRenderer
                bundleId={resolvedBundleId ?? undefined}
                file={fileWithUrl}
                rotation={fileRotations[fileWithUrl.id] ?? 0}
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
