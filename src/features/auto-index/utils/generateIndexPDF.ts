// features/index-generator/utils/generateIndexPDF.ts
import { PDFDocument, rgb } from "pdf-lib";
import type { IndexEntry } from "../types";

const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842; // A4
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const ENTRY_HEIGHT = 50; // Space needed per entry

const generateIndexPDF = async (entries: IndexEntry[]): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();

  // Create first page and add header
  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPosition = PAGE_HEIGHT - MARGIN_TOP;

  // Title on first page only
  currentPage.drawText("Table of Contents", {
    x: PAGE_WIDTH / 3,
    y: yPosition,
    size: 24,
    color: rgb(0, 0, 0),
  });

  // leaving some space between lines
  yPosition -= 30;

  // Separator line
  currentPage.drawLine({
    start: { x: MARGIN_LEFT, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // leaving some space between lines
  yPosition -= 30;

  // Index entries
  entries.forEach((entry, index) => {
    // Calculate space needed for this entry
    const spaceNeeded = ENTRY_HEIGHT;

    // Check if we need a new page
    // If current position minus space needed is less than bottom margin, create new page
    if (yPosition - spaceNeeded < MARGIN_BOTTOM) {
      // Create new page
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPosition = PAGE_HEIGHT - MARGIN_TOP;

      // Add "continued" header on new page
      currentPage.drawText("Table of Contents (continued)", {
        x: MARGIN_LEFT,
        y: yPosition,
        size: 14,
        color: rgb(0.4, 0.4, 0.4),
      });

      yPosition -= 25;

      // Separator line
      currentPage.drawLine({
        start: { x: MARGIN_LEFT, y: yPosition },
        end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPosition -= 20;
    }

    // Draw entry on current page
    // File number
    currentPage.drawText(`${index + 1}.`, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // File name
    currentPage.drawText(entry.fileName, {
      x: MARGIN_LEFT + 30,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Page numbers (right aligned)
    const pageRange = `${entry.startPage}-${entry.endPage}`;
    currentPage.drawText(pageRange, {
      x: PAGE_WIDTH - MARGIN_RIGHT - 100,
      y: yPosition,
      size: 11,
      color: rgb(0.4, 0.4, 0.4),
    });

    yPosition -= ENTRY_HEIGHT;
  });

  return pdfDoc.save();
};

export default generateIndexPDF;
