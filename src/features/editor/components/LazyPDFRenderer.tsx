import { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Fallback from '@/components/Fallback';
import PDFDocument from './Document';
import type { FileTreeFileNode } from '@/features/file-explorer/types/fileTree';

type LazyPDFRendererProps = {
  file: FileTreeFileNode;
  bundleId?: string;
  rotation: number;
  onVisible?: () => void;
  onPageMetrics?: (metrics: { fileId: string; width: number }) => void;
};

// Renders the PDF only when the wrapper enters the viewport
const LazyPDFRenderer = ({
  file,
  bundleId,
  rotation,
  onVisible,
  onPageMetrics,
}: LazyPDFRendererProps) => {
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
          <PDFDocument
            key={`${file.id}-${file.url ?? ''}`}
            bundleId={bundleId}
            file={file}
            onPageMetrics={onPageMetrics}
            rotation={rotation}
          />
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

export default LazyPDFRenderer;
