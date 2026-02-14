import { Calendar, FileCog, FileText, HardDrive } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import axiosInstance from '@/api/axiosInstance';
import type { Children } from '@/features/file-explorer/redux/fileTreeSlice';

function DocumentSettings() {
  const selectedFile = useAppSelector(state => state.fileTree.selectedFile);
  const tree = useAppSelector(state => state.fileTree.tree);
  const documentInfo = useAppSelector(
    state => state.propertiesPanel.documentInfo
  );

  const [fileSize, setFileSize] = useState<string | null>(null);

  const currentFile = useMemo(() => {
    if (!selectedFile) return null;

    const findFileById = (
      nodes: Children[],
      id: string
    ): Children | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.type === 'folder' && node.children) {
          const found = findFileById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    return findFileById(tree.children, selectedFile);
  }, [selectedFile, tree.children]);

  /*-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    Get the size of the document
  -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+*/
  useEffect(() => {
    if (!selectedFile) {
      setFileSize(null);
      return;
    }

    let isActive = true;

    const fetchFileSize = async () => {
      try {
        const response = await axiosInstance.head(
          `/api/documents/${selectedFile}/stream?original=true`
        );
        const contentLength = response.headers['content-length'];
        const bytes = Number.parseInt(contentLength, 10);

        if (!Number.isFinite(bytes)) {
          if (isActive) setFileSize('N/A');
          return;
        }

        if (isActive) {
          setFileSize(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        }
      } catch (error) {
        if (isActive) setFileSize('N/A');
        console.log('Error fetching file size:', error);
      }
    };

    fetchFileSize();

    return () => {
      isActive = false;
    };
  }, [selectedFile]);

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

  const totalPages =
    currentFile && documentInfo?.[currentFile.id]?.numPages
      ? documentInfo[currentFile.id].numPages
      : 'Loading...';

  const displayFileSize = fileSize ?? 'Loading...';

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
            title={currentFile.name}
          >
            {currentFile.name}
          </h3>
          <p className="mt-0.5 text-gray-500 text-xs">PDF Document</p>
        </div>
      </div>

      {/* Document Info Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <FileCog className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 text-sm">Total Pages</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">
            {totalPages}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 text-sm">File Size</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">
            {displayFileSize}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 text-sm">Modified</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DocumentSettings;
