import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

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

type UseMergeDocumentsParams = {
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

export const useMergeDocuments = ({ bundleId }: UseMergeDocumentsParams) => {
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
  const isMergeDisabled =
    !bundleId || !canMerge || selectedCount < 2 || isMerging;

  const clearSelection = () => {
    dispatch(clearMultiFileSelection());
  };

  const openMergeDialog = () => {
    setMergedFileName(buildDefaultMergedFileName(files.map(file => file.name)));
    setIsDialogOpen(true);
  };

  const closeMergeDialog = () => {
    setIsDialogOpen(false);
  };

  const confirmMerge = async () => {
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

  return {
    canShowBulkActions: selectedCount >= 2,
    isDialogOpen: selectedCount >= 2 && isDialogOpen,
    isMergeDisabled,
    isMerging,
    mergedFileName,
    mergedFileNamePlaceholder: DEFAULT_MERGED_FILE_NAME,
    parentLabel,
    previewFiles,
    reason,
    selectedCount,
    clearSelection,
    closeMergeDialog,
    confirmMerge,
    openMergeDialog,
    setDialogOpen: setIsDialogOpen,
    updateMergedFileName: setMergedFileName,
  };
};
