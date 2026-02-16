import type { Children } from '../../file-explorer/redux/fileTreeSlice';
import type { FileNode } from '../../file-explorer/types/types';
import type { HighlightColor } from '../../toolbar/types/types';

export type PdfDocumentInfo = {
  fileId: string;
  numPages: number;
};

export type PdfError = {
  fileId: string;
  message: string;
};

export type DocumentComponentProps = {
  file: FileNode;
};

export type UseModifiedPDFsResult = {
  modifiedFiles: Array<{
    id: string;
    name: string;
    type: 'file';
    url: string;
    originalUrl: string;
  }>;
  isLoading: boolean;
  error: string | null;
};

export type TextHighlightableDocumentProps = {
  file: Children;
  scale?: number;
  onPageMetrics?: (metrics: { fileId: string; width: number }) => void;
};

export type colorPickerPositonType = {
  x: number;
  y: number;
};

export type ColorPickerProps = {
  onColorSelect: (color: HighlightColor) => void;
};

export type HighlightOverlayProps = {
  fileId: string;
  pageNumber: number;
  pageHeight: number; // PDF page height in PDF units
  scale: number;
};
