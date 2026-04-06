import type { LucideIcon } from 'lucide-react';
import { Calendar, FileCog, FileText, HardDrive } from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useGetDocumentMetadataQuery } from '@/features/properties-panel/api';

const formatFileSize = (bytes: number | null): string => {
  if (bytes === null || !Number.isFinite(bytes)) {
    return 'N/A';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const formatDate = (dateValue: string | null): string => {
  if (!dateValue) {
    return 'N/A';
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A';
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

type InfoRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  title?: string;
  monospace?: boolean;
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
  title,
  monospace = false,
}: InfoRowProps) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <span className="text-gray-600 text-sm">{label}</span>
      </div>
      <span
        className={`max-w-40 truncate text-right font-semibold text-gray-900 text-sm ${
          monospace ? 'font-mono text-xs' : ''
        }`}
        title={title ?? value}
      >
        {value}
      </span>
    </div>
  );
};

function DocumentSettings() {
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const tree = useAppSelector(state => state.fileTree.tree);
  const documentInfo = useAppSelector(
    state => state.propertiesPanel.documentInfo
  );

  const currentFile = useMemo(() => {
    if (!selectedFile) return null;
    const node = tree.nodes[selectedFile];
    return node?.type === 'file' ? node : null;
  }, [selectedFile, tree.nodes]);
  const {
    data: metadata,
    isLoading: isMetadataLoading,
    isFetching: isMetadataFetching,
  } = useGetDocumentMetadataQuery(currentFile?.id ?? skipToken);

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-gray-500 text-sm">No document selected</p>
        <p className="mt-1 text-gray-400 text-xs">
          Select a document to view details
        </p>
      </div>
    );
  }

  const fallbackPageCount = documentInfo[currentFile.id]?.numPages ?? null;
  const totalPages = metadata?.pageCount ?? fallbackPageCount;
  const isMetadataPending =
    (isMetadataLoading || isMetadataFetching) && !metadata;

  const displayPages =
    totalPages !== null
      ? String(totalPages)
      : isMetadataPending
        ? 'Loading...'
        : 'N/A';
  const displayFileSize = metadata
    ? formatFileSize(metadata.fileSizeBytes)
    : isMetadataPending
      ? 'Loading...'
      : 'N/A';
  const displayModified = metadata
    ? formatDate(metadata.lastModifiedAt)
    : isMetadataPending
      ? 'Loading...'
      : 'N/A';
  const documentTitle = metadata?.originalName || currentFile.name;

  return (
    <div className="mx-2 space-y-1">
      {/* Document Header */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-2">
        <div className="rounded-lg bg-blue-100 p-2">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="truncate font-semibold text-gray-900 text-sm"
            title={documentTitle}
          >
            {documentTitle}
          </h3>
          <p className="mt-0.5 text-gray-500 text-xs">PDF Document</p>
        </div>
      </div>

      {/* Document Info Grid */}
      <div className="space-y-2">
        <InfoRow icon={FileCog} label="Total Pages" value={displayPages} />
        <InfoRow icon={HardDrive} label="File Size" value={displayFileSize} />
        <InfoRow icon={Calendar} label="Modified" value={displayModified} />
      </div>
    </div>
  );
}

export default DocumentSettings;
