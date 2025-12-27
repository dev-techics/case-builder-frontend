import type React from 'react';
import { useState } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addFiles } from '../../file-explorer/fileTreeSlice';
import type { FileNode } from '../types';
import { FileImportIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import axiosInstance from '@/api/axiosInstance';
import { useParams } from 'react-router-dom';

interface FileUploadHandlerProps {
  bundleId: string; // The bundle/project ID
  parentId?: string | null; // Optional: if uploading into a specific folder
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
  bundleId,
  parentId = null,
}) => {
  const dispatch = useAppDispatch();
  const [isUploading, setIsUploading] = useState(false);
  bundleId = useParams<{ bundleId: string }>().bundleId || bundleId;
  console.log('FileUploadHandler bundleId:', bundleId);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files are PDFs
    const pdfFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        pdfFiles.push(file);
      } else {
        console.warn(`Skipping non-PDF file: ${file.name}`);
      }
    }

    if (pdfFiles.length === 0) {
      alert('Please select at least one PDF file');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Append all PDF files
      pdfFiles.forEach(file => {
        formData.append('files[]', file);
      });

      // Add parent_id if uploading into a folder
      if (parentId) {
        formData.append('parent_id', parentId);
      }

      // Upload to server
      const response = await axiosInstance.post(
        `/api/bundles/${bundleId}/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Upload successful:', response.data);

      // Extract the uploaded documents from response
      const uploadedDocuments: FileNode[] = response.data.documents.map(
        (doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          url: doc.url,
        })
      );

      // Add files to Redux store
      dispatch(addFiles(uploadedDocuments));

      alert(`Successfully uploaded ${uploadedDocuments.length} file(s)`);
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to upload files';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="p-2 cursor-pointer hover:bg-gray-200 rounded-lg">
      <label
        className={`text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <HugeiconsIcon icon={FileImportIcon} size={18} />
        <input
          accept=".pdf,application/pdf"
          className="hidden"
          multiple
          onChange={handleFileUpload}
          type="file"
          disabled={isUploading}
        />
      </label>
      {isUploading && (
        <span className="text-xs text-gray-500 ml-2">Uploading...</span>
      )}
    </div>
  );
};

export default FileUploadHandler;
