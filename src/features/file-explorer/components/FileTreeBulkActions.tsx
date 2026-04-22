import { Layers2, LoaderCircle, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
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

import { useMergeDocumentsMutation } from '../api';
import {
  clearMultiFileSelection,
  selectFile,
  setScrollToFile,
} from '../redux/fileTreeSlice';
import {
  selectFileTree,
  selectIsMergingDocuments,
  selectMergeSelectionContext,
} from '../redux/selectors';
import type { FileTree } from '../types/fileTree';

type FileTreeBulkActionsProps = {
  bundleId: string;
};

const DEFAULT_MERGED_FILE_NAME = 'Merged document';
const MAX_PREVIEW_FILES = 6;

const stripFileExtension = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '');

const ensurePdfExtension = (fileName: string) =>
  /\.pdf$/i.test(fileName) ? fileName : `${fileName}`;

const buildDefaultMergedFileName = (fileNames: string[]) => {
  if (fileNames.length === 0) {
    return DEFAULT_MERGED_FILE_NAME;
  }

  const baseName = stripFileExtension(fileNames[0]).trim();
  if (!baseName) {
    return DEFAULT_MERGED_FILE_NAME;
  }

  return ensurePdfExtension(`${baseName} merged`);
};

const resolveMutationErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const payload = error as {
      data?: unknown;
      error?: unknown;
      message?: unknown;
    };

    if (typeof payload.data === 'string') {
      return payload.data;
    }

    if (payload.data && typeof payload.data === 'object') {
      const nestedData = payload.data as { message?: unknown; error?: unknown };
      if (typeof nestedData.message === 'string') {
        return nestedData.message;
      }
      if (typeof nestedData.error === 'string') {
        return nestedData.error;
      }
    }

    if (typeof payload.error === 'string') {
      return payload.error;
    }

    if (typeof payload.message === 'string') {
      return payload.message;
    }
  }

  return 'Failed to merge files.';
};

const findMergedFileId = ({
  previousTree,
  nextTree,
  parentId,
  expectedName,
  excludedIds,
}: {
  previousTree: FileTree;
  nextTree: FileTree;
  parentId: string | null;
  expectedName: string;
  excludedIds: string[];
}) => {
  const excludedIdSet = new Set(excludedIds);
  const previousChildIds =
    parentId === null
      ? previousTree.rootIds
      : (previousTree.children[parentId] ?? []);
  const previousChildIdSet = new Set(previousChildIds);
  const nextChildIds =
    parentId === null ? nextTree.rootIds : (nextTree.children[parentId] ?? []);

  const candidates = nextChildIds
    .map(nodeId => nextTree.nodes[nodeId])
    .filter(
      (node): node is Extract<FileTree['nodes'][string], { type: 'file' }> =>
        Boolean(node && node.type === 'file' && !excludedIdSet.has(node.id))
    );

  const newlyInsertedCandidates = candidates.filter(
    node => !previousChildIdSet.has(node.id)
  );
  const newlyInsertedExactNameMatches = newlyInsertedCandidates.filter(
    node => node.name === expectedName
  );
  if (newlyInsertedExactNameMatches.length > 0) {
    return newlyInsertedExactNameMatches[
      newlyInsertedExactNameMatches.length - 1
    ].id;
  }

  const exactNameMatches = candidates.filter(
    node => node.name === expectedName
  );
  if (exactNameMatches.length > 0) {
    return exactNameMatches[exactNameMatches.length - 1].id;
  }

  if (newlyInsertedCandidates.length > 0) {
    return newlyInsertedCandidates[newlyInsertedCandidates.length - 1].id;
  }

  return candidates.length > 0 ? candidates[candidates.length - 1].id : null;
};

const FileTreeBulkActions = ({ bundleId }: FileTreeBulkActionsProps) => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector(selectFileTree);
  const isMerging = useAppSelector(selectIsMergingDocuments);
  const {
    canMerge,
    files,
    orderedSelectedFileIds,
    parentId,
    parentLabel,
    reason,
  } = useAppSelector(selectMergeSelectionContext);

  const [mergeDocuments] = useMergeDocumentsMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mergedFileName, setMergedFileName] = useState(
    DEFAULT_MERGED_FILE_NAME
  );

  const selectedCount = files.length;
  const previewFiles = useMemo(
    () => files.slice(0, MAX_PREVIEW_FILES),
    [files]
  );

  if (selectedCount < 2) {
    return null;
  }

  const isMergeDisabled =
    !bundleId || !canMerge || selectedCount < 2 || isMerging;

  const handleClearSelection = () => {
    dispatch(clearMultiFileSelection());
  };

  const handleOpenMergeDialog = () => {
    setMergedFileName(buildDefaultMergedFileName(files.map(file => file.name)));
    setIsDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    if (isMergeDisabled) {
      return;
    }

    const normalizedFileName = ensurePdfExtension(
      mergedFileName.trim() ||
        buildDefaultMergedFileName(files.map(file => file.name))
    );
    const previousTree = tree;

    try {
      const mergeResult = await mergeDocuments({
        bundleId,
        documentIds: orderedSelectedFileIds,
        name: normalizedFileName,
        parentId,
      }).unwrap();
      const nextTree = mergeResult.tree;

      dispatch(clearMultiFileSelection());

      const mergedFileId =
        mergeResult.mergedDocumentId &&
        nextTree.nodes[mergeResult.mergedDocumentId]?.type === 'file'
          ? mergeResult.mergedDocumentId
          : findMergedFileId({
              previousTree,
              nextTree,
              parentId,
              expectedName:
                mergeResult.mergedDocumentName ?? normalizedFileName,
              excludedIds: orderedSelectedFileIds,
            });

      if (mergedFileId) {
        dispatch(selectFile(mergedFileId));
        dispatch(setScrollToFile(mergedFileId));
      }

      setIsDialogOpen(false);
      toast.success(`Merged ${orderedSelectedFileIds.length} files.`);
    } catch (error) {
      toast.error(resolveMutationErrorMessage(error));
    }
  };

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
              onClick={handleOpenMergeDialog}
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
              onClick={handleClearSelection}
              type="button"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
      {/* --------- Merge confirmation dialog ------------ */}
      <Dialog
        open={selectedCount >= 2 && isDialogOpen}
        onOpenChange={setIsDialogOpen}
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
                onChange={event => setMergedFileName(event.target.value)}
                placeholder={DEFAULT_MERGED_FILE_NAME}
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
              onClick={() => setIsDialogOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              disabled={isMergeDisabled}
              onClick={handleConfirmMerge}
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
