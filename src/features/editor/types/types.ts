import type { FileTreeFileNode } from '../../file-explorer/types/fileTree';

export type TextHighlightableDocumentProps = {
  file: FileTreeFileNode;
  scale?: number;
  rotation?: number;
  onPageMetrics?: (metrics: { fileId: string; width: number }) => void;
};

export type HighlightOverlayProps = {
  fileId: string;
  pageNumber: number;
  pageHeight: number; // PDF page height in PDF units
  scale: number;
};
