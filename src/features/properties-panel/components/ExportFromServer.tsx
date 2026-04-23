// features/properties-panel/components/ExportFromServer.tsx
import { AlertCircle, CheckCircle, Download, FileStack } from 'lucide-react';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  FileTree,
  FileTreeNode,
} from '@/features/file-explorer/types/fileTree';
import { useExportBundle } from '../hooks';
import type { ExportCompressionProfile } from '../api';
import CoverPage from '../../cover-page';
import { setBundleId } from '../../cover-page/redux/coverPageSlice';
import { useParams } from 'react-router-dom';

/**
 * Recursively collects all file nodes from the flat tree structure
 */
const collectAllFiles = (
  tree: FileTree
): Array<Extract<FileTreeNode, { type: 'file' }>> => {
  const files: Array<Extract<FileTreeNode, { type: 'file' }>> = [];
  const visited = new Set<string>();

  const walk = (ids: ReadonlyArray<string>) => {
    for (const id of ids) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = tree.nodes[id];
      if (!node) continue;

      if (node.type === 'file' && node.url) {
        files.push(node);
        continue;
      }

      if (node.type === 'folder') {
        walk(tree.children[node.id] ?? []);
      }
    }
  };

  walk(tree.rootIds);
  return files;
};

const COMPRESSION_PROFILE_OPTIONS: Array<{
  value: ExportCompressionProfile;
  label: string;
}> = [
  { value: 'none', label: 'No compression' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'small', label: 'Small' },
  { value: 'tiny', label: 'Tiny' },
  { value: 'extreme', label: 'Extreme' },
];

function ExportFromServer() {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(states => states.fileTree.tree);
  const { headerLeft, headerRight, footer } = useAppSelector(
    states => states.propertiesPanel.headersFooter
  );

  // select the front and back cover page from redux state
  const { frontCoverPage, backCoverPage } = useAppSelector(
    state => state.coverPage
  );
  const frontEnabled = Boolean(frontCoverPage);
  const backEnabled = Boolean(backCoverPage);

  // Get highlights from toolbar slice
  const highlights = useAppSelector(state => state.toolbar.highlights);

  const { bundleId: routeBundleId } = useParams<{ bundleId: string }>();

  // Recursively collect all PDF files from the entire tree
  const pdfFiles = collectAllFiles(tree);
  const hasFiles = pdfFiles.length > 0;

  const bundleId =
    routeBundleId || (tree.id === 'bundle-loading' ? '' : tree.id);

  const {
    compressionProfile,
    exportMessage,
    exportStatus,
    handleExport,
    includeBackCover,
    includeFrontCover,
    includeIndex,
    isExporting,
    setCompressionProfile,
    setIncludeBackCover,
    setIncludeFrontCover,
    setIncludeIndex,
    setTargetSizeMb,
    targetSizeMb,
  } = useExportBundle({
    hasFiles,
    bundleId,
    projectName: tree.projectName,
    pdfFileCount: pdfFiles.length,
    frontCoverAvailable: frontEnabled,
    backCoverAvailable: backEnabled,
  });

  // Load cover page data when component mounts
  useEffect(() => {
    dispatch(setBundleId(bundleId || null));
  }, [bundleId, dispatch]);

  return (
    <div className="space-y-4">
      {/* Front Cover Page Manager */}
      <CoverPage type="front" />

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
      <CoverPage type="back" />

      {/* Export Options */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="mb-2 font-semibold text-blue-900 text-xs">
          Export Options
        </p>
        <div className="space-y-2 text-blue-800 text-xs">
          {frontCoverPage && (
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
          {backCoverPage && (
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

          <div className="grid gap-3 border-blue-200 border-t pt-3">
            <div className="grid gap-1.5">
              <label
                className="font-medium text-blue-900 text-xs"
                htmlFor="export-compression-profile"
              >
                Compression profile
              </label>
              <Select
                disabled={isExporting}
                onValueChange={value =>
                  setCompressionProfile(value as ExportCompressionProfile)
                }
                value={compressionProfile}
              >
                <SelectTrigger
                  className="w-full bg-white"
                  id="export-compression-profile"
                >
                  <SelectValue placeholder="Select compression profile" />
                </SelectTrigger>
                <SelectContent>
                  {COMPRESSION_PROFILE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label
                className="font-medium text-blue-900 text-xs"
                htmlFor="export-target-size"
              >
                Target size (MB)
              </label>
              <Input
                className="bg-white"
                disabled={isExporting || compressionProfile === 'none'}
                id="export-target-size"
                inputMode="decimal"
                min="0.1"
                onChange={event => setTargetSizeMb(event.target.value)}
                placeholder="Enter target size"
                step="0.1"
                type="number"
                value={targetSizeMb}
              />
            </div>

            <p className="text-blue-700/90 text-xs leading-relaxed">
              The smaller the target size, the lower the document quality will
              be. Target size is only used when a compression profile is
              selected.
            </p>
          </div>
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
        disabled={!hasFiles || !bundleId || isExporting}
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

export default ExportFromServer;
