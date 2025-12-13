import { getDocument } from 'pdfjs-dist';

/**
 * Extract text content and metadata from a PDF page
 */
export async function testPdfTextExtraction(fileUrl: string) {
  const loadingTask = getDocument(fileUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  return {
    items: textContent.items,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Get PDF page information including dimensions and position
 */
export async function getPdfPageInfo(fileUrl: string, pageNumber = 1) {
  const loadingTask = getDocument(fileUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });

  return {
    width: viewport.width,
    height: viewport.height,
    pageNumber,
  };
}

/**
 * Convert screen coordinates to PDF coordinates
 * PDF coordinate system: origin (0,0) is at bottom-left
 * Screen coordinate system: origin (0,0) is at top-left
 */
export const ScreenToPdfCoordinates = (
  screenCoordinates: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    pageNumber?: number;
  },
  pageInfo: {
    left?: number;
    top?: number;
    width: number;
    height: number;
  },
  scale = 1
) => {
  // Get the page offset (where the PDF page is rendered on screen)
  const pageOffsetLeft = pageInfo.left || 0;
  const pageOffsetTop = pageInfo.top || 0;

  // Convert screen coordinates to PDF space
  // Remove page offset and scale
  const pdfLeft = (screenCoordinates.left - pageOffsetLeft) / scale;
  const pdfTop = (screenCoordinates.top - pageOffsetTop) / scale;
  const pdfRight = (screenCoordinates.right - pageOffsetLeft) / scale;
  const pdfBottom = (screenCoordinates.bottom - pageOffsetTop) / scale;

  // Convert Y coordinate (flip vertical axis)
  // In PDF: Y=0 is at bottom, Y increases upward
  // In Screen: Y=0 is at top, Y increases downward
  const pdfY = pageInfo.height - pdfBottom; // Bottom edge in PDF coordinates
  const pdfHeight = pdfBottom - pdfTop;

  return {
    x: pdfLeft,
    y: pdfY,
    width: pdfRight - pdfLeft,
    height: pdfHeight,
    pageNumber: screenCoordinates.pageNumber || 1,
  };
};

/**
 * Get text selection coordinates from the browser
 */
export function getTextSelectionCoordinates(pageElement: HTMLElement) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();

  if (rects.length === 0) {
    return null;
  }

  // Get the page element's position
  const pageRect = pageElement.getBoundingClientRect();

  // For multi-line selections, we might have multiple rectangles
  // We'll create a bounding box that encompasses all of them
  const allRects = Array.from(rects);

  const minLeft = Math.min(...allRects.map(r => r.left));
  const minTop = Math.min(...allRects.map(r => r.top));
  const maxRight = Math.max(...allRects.map(r => r.right));
  const maxBottom = Math.max(...allRects.map(r => r.bottom));

  // Convert to coordinates relative to the page element
  return {
    left: minLeft - pageRect.left,
    top: minTop - pageRect.top,
    right: maxRight - pageRect.left,
    bottom: maxBottom - pageRect.top,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
    selectedText: selection.toString(),
  };
}

/**
 * Get multiple highlight rectangles for multi-line text selection
 */
export function getMultiLineTextSelectionCoordinates(
  pageElement: HTMLElement,
  pageInfo: { width: number; height: number; left?: number; top?: number },
  scale = 1
) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();

  if (rects.length === 0) {
    return [];
  }

  const pageRect = pageElement.getBoundingClientRect();

  // Convert each rectangle to PDF coordinates
  return Array.from(rects).map(rect => {
    const screenCoords = {
      left: rect.left - pageRect.left,
      top: rect.top - pageRect.top,
      right: rect.right - pageRect.left,
      bottom: rect.bottom - pageRect.top,
      width: rect.width,
      height: rect.height,
    };

    return ScreenToPdfCoordinates(screenCoords, pageInfo, scale);
  });
}
