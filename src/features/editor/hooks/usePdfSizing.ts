import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';

type UsePdfSizingOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  scale: number;
  horizontalPadding?: number;
  defaultMaxScale?: number;
};

export const usePdfSizing = ({
  containerRef,
  contentRef,
  scale,
  horizontalPadding = 32,
  defaultMaxScale = 3.0,
}: UsePdfSizingOptions) => {
  const [contentWidth, setContentWidth] = useState<number>(0);
  const [maxBaseWidth, setMaxBaseWidth] = useState<number | null>(null);
  const pageWidthsRef = useRef<Map<string, number>>(new Map());

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
  }, [containerRef, contentRef]);

  const availableWidth = useMemo(
    () => Math.max(0, contentWidth - horizontalPadding),
    [contentWidth, horizontalPadding]
  );

  const computedMaxScale = useMemo(() => {
    if (!maxBaseWidth || availableWidth === 0) {
      return defaultMaxScale;
    }
    return Math.min(defaultMaxScale, availableWidth / maxBaseWidth);
  }, [availableWidth, defaultMaxScale, maxBaseWidth]);

  const scaledDocumentWidth = useMemo(() => {
    if (!maxBaseWidth) {
      return null;
    }
    return Math.ceil(maxBaseWidth * scale + horizontalPadding);
  }, [horizontalPadding, maxBaseWidth, scale]);

  const contentStyle = useMemo<CSSProperties | undefined>(() => {
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

  const resetSizing = useCallback(() => {
    pageWidthsRef.current.clear();
    setMaxBaseWidth(null);
  }, []);

  return {
    contentStyle,
    computedMaxScale,
    handlePageMetrics,
    resetSizing,
  };
};
