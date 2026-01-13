// src/features/editor/Editor.tsx
import { FileText, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { TextHighlightableDocument } from './components/Document';
import UploadFile from './components/UploadFile';
import { loadComments } from '../toolbar/toolbarSlice';
import { DocumentApiService } from '@/api/axiosInstance';
import {
  loadMetadataFromBackend,
  setCurrentBundleId,
} from '../properties-panel/propertiesPanelSlice';
import { selectFile } from '../file-explorer/redux/fileTreeSlice';
import { useParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Fallback from '@/components/Fallback';

// Component that only renders PDF when visible
const LazyPDFRenderer: React.FC<{
  file: any;
  onVisible?: () => void;
}> = ({ file, onVisible }) => {
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
          <TextHighlightableDocument file={file} />
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

const PDFViewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(state => state.fileTree.tree);
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const bundleId = useParams().bundleId;
  const lastSaved = useAppSelector(state => state.propertiesPanel.lastSaved);

  // State for loaded files (infinite scroll) - NOW ONLY TRACKS IDS
  const [visibleFileIds, setVisibleFileIds] = useState<string[]>([]);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // Refs
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const lastLoadTimeRef = useRef<number>(0);

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    set selected file to the first file in the tree on load
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  useEffect(() => {
    if (tree.children[0]?.id) {
      dispatch(selectFile(tree.children[0].id));
    }
  }, [tree.children, dispatch]);

  /* Load comments for the current bundle */
  useEffect(() => {
    if (bundleId) {
      dispatch(loadComments({ bundleId: bundleId }));
    }
  }, [dispatch, bundleId]);

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

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Initialize with selected file AND reset when selection changes
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  useEffect(() => {
    if (selectedFile && allFiles.length > 0) {
      // Reset to show only the selected file
      setVisibleFileIds([selectedFile]);
      setIsLoadingNext(false);

      // Clear any pending loads
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Reset last load time
      lastLoadTimeRef.current = 0;

      console.log(
        `🎯 Selected file changed to: ${allFiles.find(f => f.id === selectedFile)?.name}`
      );
    }
  }, [selectedFile, allFiles]);

  /*-+-+-+-+-+-+-+-+-+-+-+-+
   Load next file function - STRICT SEQUENTIAL LOADING
  -+-+-+-+-+-+-+-+-+-+-+-+*/
  const loadNextFile = useCallback(() => {
    const now = Date.now();

    // DEBOUNCE: Prevent calls within 1.5 seconds of last load
    if (now - lastLoadTimeRef.current < 1500) {
      console.log('⏱️ Debounced - too soon since last load');
      return;
    }

    // CRITICAL: Prevent multiple simultaneous loads
    if (isLoadingNext || allFiles.length === 0) {
      console.log('🚫 Already loading or no files');
      return;
    }

    const currentLastId = visibleFileIds[visibleFileIds.length - 1];
    const currentIndex = allFiles.findIndex(f => f.id === currentLastId);

    // Check if there's a next file
    if (currentIndex === -1 || currentIndex >= allFiles.length - 1) {
      console.log('✋ No more files to load');
      return;
    }

    const nextFile = allFiles[currentIndex + 1];

    // Double-check file isn't already being loaded or loaded
    if (!nextFile || visibleFileIds.includes(nextFile.id)) {
      console.log('⚠️ File already loaded or invalid');
      return;
    }

    console.log(`📄 Loading next file: ${nextFile.name}`);

    // Lock loading state IMMEDIATELY
    setIsLoadingNext(true);
    lastLoadTimeRef.current = now;

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Wait before loading next
    loadingTimeoutRef.current = window.setTimeout(() => {
      setVisibleFileIds(prev => {
        // Triple-check to prevent race condition
        if (prev.includes(nextFile.id)) {
          console.log('⚠️ Race condition prevented');
          setIsLoadingNext(false);
          return prev;
        }
        console.log(`✅ Added file to visible list: ${nextFile.name}`);
        return [...prev, nextFile.id];
      });

      // Unlock after adding file with extra buffer
      window.setTimeout(() => {
        setIsLoadingNext(false);
        console.log('🔓 Unlocked for next load');
      }, 500); // Keep locked for extra 500ms after adding
    }, 1000); // 1 second delay
  }, [visibleFileIds, allFiles, isLoadingNext]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  /*+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Setup Intersection Observer - STRICT SINGLE TRIGGER
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  useEffect(() => {
    const sentinel = sentinelRef.current;

    // Don't observe if no files or currently loading
    if (!sentinel || visibleFileIds.length === 0 || isLoadingNext) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        // Only trigger if intersecting AND not already loading
        if (entry?.isIntersecting && !isLoadingNext) {
          loadNextFile();
        }
      },
      {
        root: null,
        rootMargin: '400px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadNextFile, visibleFileIds.length, isLoadingNext]);

  // Get visible files with their data
  const visibleFiles = useMemo(() => {
    return visibleFileIds
      .map(id => allFiles.find(f => f.id === id))
      .filter(Boolean);
  }, [visibleFileIds, allFiles]);

  // Create files with URLs and cache busting
  const filesWithUrls = useMemo(() => {
    const cacheBuster = lastSaved || Date.now();
    return visibleFiles.map(file => ({
      ...file,
      url: `${DocumentApiService.getDocumentStreamUrl(file.id)}?v=${cacheBuster}`,
    }));
  }, [visibleFiles, lastSaved]);

  /*----------------------------
      Empty State
  ------------------------------*/
  if (tree.children.length === 0) {
    return <UploadFile />;
  }

  // No file selected
  if (filesWithUrls.length === 0) {
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

  const hasMoreFiles = visibleFileIds.length < allFiles.length;

  return (
    <div className="relative flex h-full flex-col">
      {/* PDF Document Viewer Container */}
      <div
        ref={containerRef}
        className="pdf-viewer-container flex-1 overflow-y-auto bg-gray-100 p-8"
      >
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Index Page */}
          {/* Render all loaded files */}
          {filesWithUrls.map(fileWithUrl => (
            <div
              key={fileWithUrl.id}
              className="rounded-lg bg-white shadow-lg"
              data-file-id={fileWithUrl.id}
            >
              {/* PDF Header */}
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-gray-700">
                    {fileWithUrl.name}
                  </span>
                </div>

                <button
                  aria-label={`Delete ${fileWithUrl.name}`}
                  className="rounded p-1 hover:bg-gray-200"
                  onClick={() => console.log('Delete', fileWithUrl.id)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* PDF Content Area - LAZY LOADED */}
              <LazyPDFRenderer file={fileWithUrl} />
            </div>
          ))}

          {/* Intersection Observer Sentinel */}
          {hasMoreFiles && (
            <div
              ref={sentinelRef}
              className="flex h-32 items-center justify-center"
            >
              {isLoadingNext ? (
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-blue-500" />
                  <div className="text-gray-500 font-medium">
                    Loading next PDF...
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  Scroll to load more files
                </div>
              )}
            </div>
          )}

          {/* End of files indicator */}
          {!hasMoreFiles && visibleFileIds.length > 1 && (
            <div className="flex items-center justify-center py-8">
              <div className="rounded-full bg-gray-200 px-4 py-2">
                <p className="text-gray-600 text-sm font-medium">
                  All files loaded ({visibleFileIds.length} files)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
