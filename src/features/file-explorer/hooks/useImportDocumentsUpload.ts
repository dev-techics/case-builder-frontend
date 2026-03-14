import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';

import { useUploadFilesMutation } from '../api';

type ConversionStatus = {
  fileName: string;
  status: 'converting' | 'success' | 'failed';
  message?: string;
};

type UploadResponse = {
  documents: Array<{
    id: string;
    parentId: string | null;
    name: string;
    type: string;
    url: string;
  }>;
  conversionStatuses?: ConversionStatus[];
};

type UseImportDocumentsUploadArgs = {
  bundleId: string;
  parentId?: string | null;
};

export const useImportDocumentsUpload = ({
  bundleId,
  parentId = null,
}: UseImportDocumentsUploadArgs) => {
  const [uploadFiles] = useUploadFilesMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [conversionStatuses, setConversionStatuses] = useState<
    ConversionStatus[]
  >([]);
  const [hasConversions, setHasConversions] = useState(false);
  const routeParams = useParams<{ bundleId: string }>();
  const resolvedBundleId = routeParams.bundleId || bundleId;

  const handleClose = () => {
    setIsUploading(false);
    setUploadComplete(false);
    setUploadProgress(0);
    setUploadedCount(0);
    setConversionStatuses([]);
    setHasConversions(false);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Collect all files (validation happens on backend)
    const selectedFiles: File[] = Array.from(files);

    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    // Check if any files need conversion
    const needsConversion = selectedFiles.some(
      file =>
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
    );

    setIsUploading(true);
    setUploadComplete(false);
    setUploadProgress(0);
    setHasConversions(needsConversion);
    setConversionStatuses([]);

    try {
      const formData = new FormData();

      // Append all files
      selectedFiles.forEach(file => {
        formData.append('files[]', file);
      });

      // Add parent_id if uploading into a folder
      if (parentId) {
        formData.append('parent_id', parentId);
      }

      // Upload to server with conversion support
      const response = (await uploadFiles({
        bundleId: resolvedBundleId,
        formData,
      }).unwrap()) as UploadResponse | undefined;

      console.log('✅ Upload successful:', response);

      if (
        !response ||
        typeof response !== 'object' ||
        !('documents' in response)
      ) {
        throw new Error('Unexpected upload response');
      }

      // Extract conversion statuses if any
      if (response?.conversionStatuses) {
        setConversionStatuses(response.conversionStatuses);
      }

      const uploadedCountValue = response.documents?.length ?? 0;
      console.log(response.documents);
      setUploadedCount(uploadedCountValue);
      setUploadProgress(100);
      setUploadComplete(true);
    } catch (error: unknown) {
      console.error('❌ Upload failed:', error);
      const errorMessage =
        typeof error === 'object' && error !== null && 'data' in error
          ? typeof (error as { data?: unknown }).data === 'string'
            ? (error as { data: string }).data
            : (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : 'Failed to upload files';
      alert(`Upload failed: ${errorMessage}`);
      handleClose();
    } finally {
      e.target.value = '';
    }
  };

  return {
    conversionStatuses,
    handleClose,
    handleFileUpload,
    hasConversions,
    isUploading,
    uploadComplete,
    uploadProgress,
    uploadedCount,
  };
};
