import { useCallback, useState } from 'react';
import type { DocumentPageState } from '../types/types';

const DEFAULT_ROTATION = 0;

const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

const createPage = (
  pageNumber: number,
  existingPage?: DocumentPageState
): DocumentPageState => ({
  pageNumber,
  rotation: existingPage?.rotation ?? DEFAULT_ROTATION,
  deleted: existingPage?.deleted ?? false,
});

export const useDocumentPages = () => {
  const [pages, setPages] = useState<DocumentPageState[]>([]);

  // Keep page UI state local so page actions feel immediate in the viewer.
  const syncPages = useCallback((pageCount: number) => {
    setPages(previousPages => {
      const previousPagesByNumber = new Map(
        previousPages.map(page => [page.pageNumber, page])
      );

      return Array.from({ length: pageCount }, (_, index) =>
        createPage(index + 1, previousPagesByNumber.get(index + 1))
      );
    });
  }, []);

  const rotatePage = useCallback((pageNumber: number, delta: number) => {
    setPages(previousPages =>
      previousPages.map(page =>
        page.pageNumber === pageNumber
          ? {
              ...page,
              rotation: normalizeRotation(page.rotation + delta),
            }
          : page
      )
    );
  }, []);

  const settlePageRotation = useCallback(
    (pageNumber: number, delta: number) => {
      setPages(previousPages =>
        previousPages.map(page =>
          page.pageNumber === pageNumber
            ? {
                ...page,
                rotation: normalizeRotation(page.rotation - delta),
              }
            : page
        )
      );
    },
    []
  );

  return {
    pages,
    rotatePage,
    settlePageRotation,
    syncPages,
  };
};
