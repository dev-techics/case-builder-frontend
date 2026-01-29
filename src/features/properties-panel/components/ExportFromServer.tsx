// features/properties-panel/components/Exports.tsx
import { AlertCircle, CheckCircle, Download, FileStack } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import type { Children } from '@/features/file-explorer/redux/fileTreeSlice';
import axiosInstance from '@/api/axiosInstance';
import CoverPageManager from '../../cover-page/components/CoverPageManager';
import {
  loadCoverPageTemplates,
  setBundleId,
} from '../../cover-page/redux/coverPageSlice';

/**
 * Recursively collects all PDF files from the tree structure
 */
const collectAllFiles = (children: Children[]): Children[] => {
  const files: Children[] = [];

  for (const child of children) {
    if (child.type === 'file' && child.url) {
      files.push(child);
    } else if (child.type === 'folder' && child.children) {
      const nestedFiles = collectAllFiles(child.children);
      files.push(...nestedFiles);
    }
  }

  return files;
};

function Exports() {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(states => states.fileTree.tree);
  const { headerLeft, headerRight, footer } = useAppSelector(
    states => states.propertiesPanel.headersFooter
  );

  // Get cover page state
  const coverPageEnabled = useAppSelector(state => state.coverPage.enabled);

  // Get highlights from toolbar slice
  const highlights = useAppSelector(state => state.toolbar.highlights);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'exporting' | 'success' | 'error'
  >('idle');
  const [exportMessage, setExportMessage] = useState('');
  const [includeIndex, setIncludeIndex] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);

  // Recursively collect all PDF files from the entire tree
  const pdfFiles = collectAllFiles(tree.children);
  const hasFiles = pdfFiles.length > 0;

  // Get bundle ID from tree
  const bundleId = tree.id.split('-')[1];

  // Load cover page data when component mounts
  useEffect(() => {
    if (bundleId) {
      dispatch(setBundleId(bundleId));
      dispatch(loadCoverPageTemplates());
    }
  }, [bundleId, dispatch]);

  const handleExport = async () => {
    if (!hasFiles) {
      setExportStatus('error');
      setExportMessage('No PDF files to export');
      return;
    }

    if (!bundleId) {
      setExportStatus('error');
      setExportMessage('Bundle ID not found');
      return;
    }

    setIsExporting(true);
    setExportStatus('exporting');
    setExportMessage('Preparing export on server...');

    try {
      // Make API request to backend
      const response = await axiosInstance.post(
        `/api/bundles/${bundleId}/export`,
        {
          include_index: includeIndex,
          include_cover: includeCover,
        },
        {
          responseType: 'blob', // Important: receive as blob for file download
          onDownloadProgress: progressEvent => {
            // Optional: show download progress
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setExportMessage(`Downloading... ${percentCompleted}%`);
            }
          },
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${tree.projectName || 'Bundle'}_${new Date().getTime()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Build success message
      let successParts = [];
      if (includeCover && coverPageEnabled) successParts.push('cover page');
      if (includeIndex && tree.indexUrl) successParts.push('index');
      successParts.push(`${pdfFiles.length} files`);

      const successAddons =
        successParts.length > 1
          ? ` (including ${successParts.slice(0, -1).join(', ')})`
          : '';

      setExportStatus('success');
      setExportMessage(`Successfully exported${successAddons}`);

      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error exporting bundle:', error);

      let errorMessage = 'Failed to export bundle';

      if (error.response) {
        // Server responded with error
        if (error.response.status === 403) {
          errorMessage = 'You do not have permission to export this bundle';
        } else if (error.response.status === 404) {
          errorMessage = 'Bundle not found';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your connection.';
      }

      setExportStatus('error');
      setExportMessage(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cover Page Manager */}
      <CoverPageManager />

      {/* Export Summary */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <FileStack className="h-4 w-4 text-gray-600" />
          <span className="font-semibold text-gray-700 text-sm">
            Export Summary
          </span>
        </div>
        <div className="space-y-1 text-gray-600 text-xs">
          <div className="flex justify-between">
            <span>Files to merge:</span>
            <span className="font-semibold text-gray-900">
              {pdfFiles.length}
            </span>
          </div>
          {pdfFiles.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto text-gray-500">
              {pdfFiles.map(f => (
                <div className="ml-2 truncate" key={f.id}>
                  • {f.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="mb-2 font-semibold text-blue-900 text-xs">
          Export Options
        </p>
        <div className="space-y-2 text-blue-800 text-xs">
          {coverPageEnabled && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={includeCover}
                className="rounded"
                onChange={e => setIncludeCover(e.target.checked)}
                type="checkbox"
                disabled={isExporting}
              />
              <span>Include cover page</span>
            </label>
          )}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              checked={includeIndex}
              className="rounded"
              onChange={e => setIncludeIndex(e.target.checked)}
              type="checkbox"
              disabled={isExporting}
            />
            <span>Include table of contents</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              checked={true}
              className="rounded"
              readOnly
              type="checkbox"
            />
            <span>Merge all PDFs into one document</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              checked={!!headerLeft || !!headerRight}
              className="rounded"
              readOnly
              type="checkbox"
            />
            <span>Include headers</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              checked={!!footer}
              className="rounded"
              readOnly
              type="checkbox"
            />
            <span>Include footer</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              checked={highlights.length > 0}
              className="rounded"
              readOnly
              type="checkbox"
            />
            <span>Include highlights ({highlights.length})</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              checked={true}
              className="rounded"
              readOnly
              type="checkbox"
            />
            <span>Add page numbers</span>
          </label>
        </div>
      </div>

      {/* Status Messages */}
      {exportStatus === 'success' && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-900 text-xs">
              Export successful
            </p>
            <p className="mt-0.5 text-green-700 text-xs">{exportMessage}</p>
          </div>
        </div>
      )}

      {exportStatus === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900 text-xs">Export failed</p>
            <p className="mt-0.5 text-red-700 text-xs">{exportMessage}</p>
          </div>
        </div>
      )}

      {exportStatus === 'exporting' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="font-semibold text-blue-900 text-xs">{exportMessage}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-1/3 animate-pulse bg-blue-500" />
          </div>
        </div>
      )}

      {/* Export Button */}
      <Button
        className="w-full"
        disabled={!hasFiles || isExporting}
        onClick={handleExport}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? 'Exporting...' : 'Export All'}
      </Button>

      {!hasFiles && (
        <p className="text-center text-gray-500 text-xs">
          No PDF files available to export
        </p>
      )}
    </div>
  );
}

export default Exports;
