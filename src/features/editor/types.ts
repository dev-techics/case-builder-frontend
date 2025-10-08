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
