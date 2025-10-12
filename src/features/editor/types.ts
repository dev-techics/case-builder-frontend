import type { FileNode } from "../file-explorer/types";

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
    type: "file";
    url: string;
    originalUrl: string;
  }>;
  isLoading: boolean;
  error: string | null;
};

export type Highlight = {
  id: string;
  fileId: string; // Which file this highlight belongs to
  pageNumber: number; // Which page in that file
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
  color: HighlightColor;
  createdAt?: number; // Optional: timestamp
};

export type TextHighlightableDocumentProps = {
  file: {
    url: string;
    name: string;
    id: string;
  };
  scale?: number;
};

export type HighlightColor = {
  name: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
  opacity: number;
};

export type PendingHighlight = {
  fileId: string;
  pageNumber: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
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
