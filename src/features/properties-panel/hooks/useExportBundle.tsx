import { useEffect, useRef, useState } from 'react';

import {
  useExportBundleMutation,
  useLazyDownloadExportQuery,
  useLazyGetExportStatusQuery,
} from '../api';
import type {
  ExportBundleRequestPayload,
  ExportCompressionProfile,
} from '../api';

type UseExportBundleProps = {
  hasFiles: boolean;
  bundleId: string;
  projectName?: string | null;
  pdfFileCount: number;
  frontCoverAvailable: boolean;
  backCoverAvailable: boolean;
};

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

const EXPORT_POLL_DELAY_MS = 3000;
const SUCCESS_RESET_DELAY_MS = 3000;

const sleep = (delayMs: number) =>
  new Promise<void>(resolve => {
    globalThis.setTimeout(resolve, delayMs);
  });

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  globalThis.setTimeout(() => URL.revokeObjectURL(url), 100);
};

const getExportErrorMessage = (error: unknown): string => {
  const fallback = 'Failed to export bundle';

  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const fetchError = error as {
      status?: number | string;
      data?: unknown;
      message?: string;
    };

    if (fetchError.status === 403) {
      return 'You do not have permission to export this bundle';
    }

    if (fetchError.status === 404) {
      return 'Bundle not found';
    }

    if (typeof fetchError.data === 'string') {
      return fetchError.data;
    }

    if (fetchError.data && typeof fetchError.data === 'object') {
      const response = fetchError.data as {
        message?: unknown;
        error?: unknown;
      };

      if (typeof response.message === 'string') {
        return response.message;
      }

      if (typeof response.error === 'string') {
        return response.error;
      }
    }

    if (typeof fetchError.message === 'string') {
      return fetchError.message;
    }
  }

  return fallback;
};

const useExportBundle = ({
  hasFiles,
  bundleId,
  projectName,
  pdfFileCount,
  frontCoverAvailable,
  backCoverAvailable,
}: UseExportBundleProps) => {
  const [startExportBundle] = useExportBundleMutation();
  const [checkExportStatus] = useLazyGetExportStatusQuery();
  const [downloadExport] = useLazyDownloadExportQuery();

  const [includeIndex, setIncludeIndex] = useState(true);
  const [includeFrontCover, setIncludeFrontCover] =
    useState(frontCoverAvailable);
  const [includeBackCover, setIncludeBackCover] = useState(backCoverAvailable);
  const [compressionProfile, setCompressionProfile] =
    useState<ExportCompressionProfile>('tiny');
  const [targetSizeMb, setTargetSizeMb] = useState('10');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportMessage, setExportMessage] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null
  );

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        globalThis.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const handleExport = async () => {
    if (resetTimerRef.current !== null) {
      globalThis.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (!hasFiles || !bundleId) {
      setExportStatus('error');
      setExportMessage(
        !hasFiles ? 'No PDF files to export' : 'Bundle ID not found'
      );
      return;
    }

    const trimmedTargetSizeMb = targetSizeMb.trim();
    const parsedTargetSizeMb = Number.parseFloat(trimmedTargetSizeMb);
    const isCompressionEnabled = compressionProfile !== 'none';

    if (
      isCompressionEnabled &&
      (!trimmedTargetSizeMb ||
        !Number.isFinite(parsedTargetSizeMb) ||
        parsedTargetSizeMb <= 0)
    ) {
      setExportStatus('error');
      setExportMessage('Please enter a valid target size in MB');
      return;
    }

    setIsExporting(true);
    setExportStatus('exporting');
    setExportMessage('Starting export...');

    try {
      const exportPayload = {
        include_index: includeIndex,
        include_front_cover: includeFrontCover && frontCoverAvailable,
        include_back_cover: includeBackCover && backCoverAvailable,
        compression_profile: compressionProfile,
        ...(isCompressionEnabled ? { target_size_mb: parsedTargetSizeMb } : {}),
      } satisfies ExportBundleRequestPayload;

      const exportResponse = await startExportBundle({
        bundleId,
        payload: exportPayload,
      }).unwrap();

      if (!exportResponse.exportId) {
        throw new Error('Export job ID not returned by server');
      }

      setExportMessage('Processing PDF on server...');

      while (true) {
        const statusData = await checkExportStatus(
          exportResponse.exportId,
          false
        ).unwrap();

        if (statusData.status === 'complete') {
          break;
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Export failed on server');
        }

        setExportMessage(
          statusData.status === 'processing'
            ? 'Generating PDF...'
            : 'Waiting in queue...'
        );
        await sleep(EXPORT_POLL_DELAY_MS);
      }

      setExportMessage('Downloading...');
      const downloadBlob = await downloadExport(
        exportResponse.exportId,
        false
      ).unwrap();

      const fileBaseName = (projectName?.trim() || 'Bundle').replace(
        /\s+/g,
        '_'
      );
      triggerBrowserDownload(downloadBlob, `${fileBaseName}_${Date.now()}.pdf`);

      const successParts: string[] = [];
      if (includeFrontCover && frontCoverAvailable) {
        successParts.push('front cover');
      }
      if (includeBackCover && backCoverAvailable) {
        successParts.push('back cover');
      }
      if (includeIndex) {
        successParts.push('index');
      }
      successParts.push(`${pdfFileCount} files`);

      const successAddons =
        successParts.length > 1
          ? ` (including ${successParts.slice(0, -1).join(', ')})`
          : '';

      setExportStatus('success');
      setExportMessage(`Successfully exported${successAddons}`);

      resetTimerRef.current = globalThis.setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
        resetTimerRef.current = null;
      }, SUCCESS_RESET_DELAY_MS);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setExportMessage(getExportErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  return {
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
  };
};

export default useExportBundle;
