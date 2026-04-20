import { useCallback, type MouseEvent, type RefObject } from 'react';
import { useAppDispatch } from '@/app/hooks';
import {
  setPendingComment,
  setPendingHighlight,
} from '@/features/toolbar/redux';
import {
  getTextSelectionCoordinates,
  ScreenToPdfCoordinates,
} from '@/lib/pdfCoordinateUtils';
import type { DocumentPageMetrics } from '../types/types';

type UseDocumentMouseUpOptions = {
  fileId: string;
  fileName: string;
  pageInfo: Map<number, DocumentPageMetrics>;
  pageRefs: RefObject<Map<number, HTMLDivElement> | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  scale: number;
  activeTool: string;
};

export const useDocumentMouseUp = ({
  fileId,
  fileName,
  pageInfo,
  pageRefs,
  containerRef,
  scale,
  activeTool,
}: UseDocumentMouseUpOptions) => {
  const dispatch = useAppDispatch();

  return useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.comment-input') ||
        target.closest('.annotation-toolbar')
      ) {
        return;
      }

      if (activeTool !== 'highlight' && activeTool !== 'comment') {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') {
        return;
      }

      let selectedPageNumber: number | null = null;
      let pageElement: HTMLDivElement | null = null;

      const pageRefsMap = pageRefs.current;
      if (!pageRefsMap) {
        return;
      }

      pageRefsMap.forEach((element, pageNumber) => {
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
        fileId,
        fileName,
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

      const pickerY = pageRect.top - containerRect.top + selectionCoords.top;

      if (activeTool === 'highlight') {
        dispatch(
          setPendingHighlight({
            fileId,
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
      }

      if (activeTool === 'comment') {
        dispatch(
          setPendingComment({
            fileId,
            pageNumber: foundPageNumber,
            selectedText: selectionCoords.selectedText,
            position: {
              x: 0,
              y: pickerY,
              pageY: pickerY,
            },
          })
        );
      }
    },
    [
      activeTool,
      containerRef,
      dispatch,
      fileId,
      fileName,
      pageInfo,
      pageRefs,
      scale,
    ]
  );
};
