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
