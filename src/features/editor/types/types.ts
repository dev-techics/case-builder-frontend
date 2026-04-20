import type { FileTreeFileNode } from '../../file-explorer/types/fileTree';

export type TextHighlightableDocumentProps = {
  file: FileTreeFileNode;
  bundleId?: string;
  scale?: number;
  rotation?: number;
  onPageMetrics?: (metrics: { fileId: string; width: number }) => void;
};

export type DocumentPageState = {
  pageNumber: number;
  rotation: number;
  deleted: boolean;
};

export type DocumentPageMetrics = {
  pageNumber: number;
  width: number;
  height: number;
};

export type HighlightOverlayProps = {
  fileId: string;
  pageNumber: number;
  pageHeight: number; // PDF page height in PDF units
  scale: number;
};
