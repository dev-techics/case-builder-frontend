/**
 * Component: File tree bulk actions:
 * - Displays bulk action options when multiple files are selected in the file explorer.
 * - Currently supports merging multiple files into a single PDF. Shows a dialog to confirm the merge action,
 * - allowing the user to specify the name of the merged file and preview the files being merged.
 *
 * Props:
 *
 * Authors: @anikdey13
 */
/*================== File Imports ==================*/
import { Layers2, LoaderCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useMergeDocuments } from '../hooks/useMergeDocuments';
/*=================================================*/

type FileTreeBulkActionsProps = {
  bundleId: string;
};

const FileTreeBulkActions = ({ bundleId }: FileTreeBulkActionsProps) => {
  const {
    canShowBulkActions,
    clearSelection,
    closeMergeDialog,
    confirmMerge,
    isDialogOpen,
    isMergeDisabled,
    isMerging,
    mergedFileName,
    mergedFileNamePlaceholder,
    openMergeDialog,
    parentLabel,
    previewFiles,
    reason,
    selectedCount,
    setDialogOpen,
    updateMergedFileName,
  } = useMergeDocuments({ bundleId });

  if (!canShowBulkActions) {
    return null;
  }

  return (
    <>
      <div className="border-gray-200 border-b bg-blue-50/70 px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-gray-900 text-sm">
              <Layers2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {selectedCount} file{selectedCount === 1 ? '' : 's'} selected
              </span>
            </div>
            <p
              className={`mt-1 text-xs ${
                reason ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {reason ??
                `Merge order follows the explorer order in ${parentLabel}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isMergeDisabled}
              onClick={openMergeDialog}
              type="button"
            >
              {isMerging ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Layers2 className="h-4 w-4" />
              )}
              Merge
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              type="button"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
      {/* ------------------------ 
        Merge confirmation dialog 
        --------------------------*/}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Merge files</DialogTitle>
            <DialogDescription>
              Combine {selectedCount} files from {parentLabel} into a single
              PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-hidden">
            <div className="space-y-2">
              <Label htmlFor="merged-file-name">Merged file name</Label>
              <Input
                id="merged-file-name"
                value={mergedFileName}
                onChange={event => updateMergedFileName(event.target.value)}
                placeholder={mergedFileNamePlaceholder}
                disabled={isMerging}
              />
            </div>

            <div className="space-y-2">
              <Label>Files to merge</Label>
              <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
                <ul className="divide-y divide-gray-200">
                  {previewFiles.map((file, index) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="text-gray-500">{index + 1}.</span>
                      <span className="min-w-0 flex-1 truncate text-gray-800">
                        {file.name}
                      </span>
                    </li>
                  ))}
                  {selectedCount > previewFiles.length ? (
                    <li className="px-3 py-2 text-gray-500 text-sm">
                      +{selectedCount - previewFiles.length} more file
                      {selectedCount - previewFiles.length === 1 ? '' : 's'}
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isMerging}
              onClick={closeMergeDialog}
              type="button"
            >
              Cancel
            </Button>
            <Button
              disabled={isMergeDisabled}
              onClick={confirmMerge}
              type="button"
            >
              {isMerging ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                'Merge files'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileTreeBulkActions;
