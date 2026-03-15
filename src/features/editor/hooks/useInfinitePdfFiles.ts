import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useAppDispatch } from '@/app/hooks';
import { selectFile } from '@/features/file-explorer/redux/fileTreeSlice';

const DEFAULT_SCROLL_THRESHOLD_PX = 240;
const DEFAULT_LOAD_COOLDOWN_MS = 400;
const DEFAULT_SCROLL_TOP_SHOW_THRESHOLD = 300;
const SUPPRESS_AUTOLOAD_MS = 300;

type VisibleRange = { start: number; end: number };

type UseInfinitePdfFilesOptions = {
  treeChildren: any[];
  selectedFile: string | null;
  fileSelectionVersion: number;
  containerRef: RefObject<HTMLDivElement | null>;
  scrollThresholdPx?: number;
  loadCooldownMs?: number;
  scrollTopShowThreshold?: number;
};

const flattenFiles = (children: any[]) => {
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
};

export const useInfinitePdfFiles = ({
  treeChildren,
  selectedFile,
  fileSelectionVersion,
  containerRef,
  scrollThresholdPx = DEFAULT_SCROLL_THRESHOLD_PX,
  loadCooldownMs = DEFAULT_LOAD_COOLDOWN_MS,
  scrollTopShowThreshold = DEFAULT_SCROLL_TOP_SHOW_THRESHOLD,
}: UseInfinitePdfFilesOptions) => {
  const dispatch = useAppDispatch();

  const allFiles = useMemo(() => flattenFiles(treeChildren), [treeChildren]);

  const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null);
  const [loadingDirection, setLoadingDirection] = useState<
    'prev' | 'next' | null
  >(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const lastLoadTimeRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const loadingDirectionRef = useRef<'prev' | 'next' | null>(null);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const suppressAutoLoadUntilRef = useRef<number>(0);

  // Ensure selected file is a valid file (not a folder)
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

  // Initialize visible range for selected file
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
      containerRef.current.scrollTo({ top: 0, behavior: 'auto' });
      lastScrollTopRef.current = 0;
    }
    setShowScrollTop(false);
    suppressAutoLoadUntilRef.current = performance.now() + SUPPRESS_AUTOLOAD_MS;

    console.log(
      `🎯 Selected file changed to: ${allFiles.find(f => f.id === selectedFile)?.name}`
    );
  }, [selectedFile, fileSelectionVersion, allFiles, containerRef]);

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
    if (now - lastLoadTimeRef.current < loadCooldownMs) {
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
  }, [allFiles.length, loadCooldownMs, visibleRange]);

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
    if (now - lastLoadTimeRef.current < loadCooldownMs) {
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
  }, [allFiles.length, loadCooldownMs, visibleRange, containerRef]);

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
  }, [visibleRange, containerRef]);

  const visibleFiles = useMemo(() => {
    if (!visibleRange) {
      return [];
    }
    return allFiles.slice(visibleRange.start, visibleRange.end + 1);
  }, [visibleRange, allFiles]);

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
    const suppressAutoLoad = performance.now() < suppressAutoLoadUntilRef.current;

    if (suppressAutoLoad) {
      lastScrollTopRef.current = scrollTop;
      setShowScrollTop(scrollTop > scrollTopShowThreshold);
      return;
    }

    if (scrollTop === lastScrollTopRef.current) {
      return;
    }

    const direction = scrollTop > lastScrollTopRef.current ? 'down' : 'up';
    lastScrollTopRef.current = scrollTop;

    // Show/hide scroll-to-top button
    setShowScrollTop(scrollTop > scrollTopShowThreshold);

    const nearTop = scrollTop <= scrollThresholdPx;
    const nearBottom =
      scrollTop + clientHeight >= scrollHeight - scrollThresholdPx;

    if (direction === 'down' && nearBottom && hasNextFiles) {
      requestLoadNext();
    }

    if (direction === 'up' && nearTop && hasPreviousFiles) {
      requestLoadPrev();
    }
  }, [
    containerRef,
    hasNextFiles,
    hasPreviousFiles,
    requestLoadNext,
    requestLoadPrev,
    scrollThresholdPx,
    scrollTopShowThreshold,
    visibleRange,
  ]);

  const handleScrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [containerRef]);

  return {
    allFiles,
    visibleFiles,
    visibleRange,
    loadingDirection,
    showScrollTop,
    handleScroll,
    handleScrollToTop,
    hasPreviousFiles,
    hasNextFiles,
  };
};
