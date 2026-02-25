// features/properties-panel/components/Exports.tsx
import { AlertCircle, CheckCircle, Download, FileStack } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import type { Children } from '@/features/file-explorer/redux/fileTreeSlice';
import axiosInstance from '@/api/axiosInstance';
import CoverPage from '../../cover-page';
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
  const { frontEnabled, backEnabled } = useAppSelector(
    state => state.coverPage
  );

  // Get highlights from toolbar slice
  const highlights = useAppSelector(state => state.toolbar.highlights);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'exporting' | 'success' | 'error'
  >('idle');
  const [exportMessage, setExportMessage] = useState('');
  const [includeIndex, setIncludeIndex] = useState(true);
  const [includeFrontCover, setIncludeFrontCover] = useState(true);
  const [includeBackCover, setIncludeBackCover] = useState(true);

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
    if (!hasFiles || !bundleId) {
      setExportStatus('error');
      setExportMessage(
        !hasFiles ? 'No PDF files to export' : 'Bundle ID not found'
      );
      return;
    }

    setIsExporting(true);
    setExportStatus('exporting');
    setExportMessage('Starting export...');

    try {
      // Step 1: Kick off the export job
      const { data } = await axiosInstance.post(
        `/api/bundles/${bundleId}/export`,
        {
          include_index: includeIndex,
          include_front_cover: includeFrontCover && frontEnabled,
          include_back_cover: includeBackCover && backEnabled,
        }
      );

      const exportId = data.export_id;
      setExportMessage('Processing PDF on server...');

      // Step 2: Poll until ready
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const { data: statusData } = await axiosInstance.get(
              `/api/bundles/exports/${exportId}/status`
            );

            if (statusData.status === 'complete') {
              clearInterval(interval);
              resolve();
            } else if (statusData.status === 'failed') {
              clearInterval(interval);
              reject(new Error(statusData.error || 'Export failed on server'));
            } else {
              setExportMessage(
                statusData.status === 'processing'
                  ? 'Generating PDF...'
                  : 'Waiting in queue...'
              );
            }
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        }, 3000);
      });

      // Step 3: Download the file
      setExportMessage('Downloading...');
      const response = await axiosInstance.get(
        `/api/bundles/exports/${exportId}/download`,
        {
          responseType: 'blob',
          onDownloadProgress: progressEvent => {
            if (progressEvent.total) {
              const pct = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setExportMessage(`Downloading... ${pct}%`);
            }
          },
        }
      );

      // Trigger browser download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tree.projectName || 'Bundle'}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Build success message
      const successParts = [];
      if (includeFrontCover && frontEnabled) successParts.push('front cover');
      if (includeBackCover && backEnabled) successParts.push('back cover');
      if (includeIndex) successParts.push('index');
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
      console.error('Export error:', error);

      const errorMessage =
        error.response?.status === 403
          ? 'You do not have permission to export this bundle'
          : error.response?.status === 404
            ? 'Bundle not found'
            : error.message || 'Failed to export bundle';

      setExportStatus('error');
      setExportMessage(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Front Cover Page Manager */}
      <CoverPage type="Front" />

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

      {/* Back Cover Page Manager */}
      <CoverPage type="Back" />

      {/* Export Options */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="mb-2 font-semibold text-blue-900 text-xs">
          Export Options
        </p>
        <div className="space-y-2 text-blue-800 text-xs">
          {frontEnabled && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={includeFrontCover}
                className="rounded"
                onChange={e => setIncludeFrontCover(e.target.checked)}
                type="checkbox"
                disabled={isExporting}
              />
              <span>Include front cover page</span>
            </label>
          )}
          {backEnabled && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={includeBackCover}
                className="rounded"
                onChange={e => setIncludeBackCover(e.target.checked)}
                type="checkbox"
                disabled={isExporting}
              />
              <span>Include back cover page</span>
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
            <input checked={true} className="rounded" readOnly type="checkbox" />
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
            <input checked={true} className="rounded" readOnly type="checkbox" />
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