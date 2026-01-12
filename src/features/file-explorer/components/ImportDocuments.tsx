import type React from 'react';
import { useState } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addFiles } from '../redux/fileTreeSlice';
import type { FileNode } from '../types/types';
import { FileImportIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import axiosInstance from '@/api/axiosInstance';
import { useParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X } from 'lucide-react';

interface ImportDocumentsProps {
  bundleId: string; // The bundle/project ID
  parentId?: string | null; // Optional: if uploading into a specific folder
}

const ImportDocuments: React.FC<ImportDocumentsProps> = ({
  bundleId,
  parentId = null,
}) => {
  const dispatch = useAppDispatch();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  bundleId = useParams<{ bundleId: string }>().bundleId || bundleId;

  const handleClose = () => {
    setIsUploading(false);
    setUploadComplete(false);
    setUploadProgress(0);
    setUploadedCount(0);
  };

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
    setUploadComplete(false);
    setUploadProgress(0);

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
          onUploadProgress: progressEvent => {
            if (!progressEvent.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            setUploadProgress(percent);
          },
        }
      );

      console.log('✅ Upload successful:', response.data);

      // Extract the uploaded documents from response
      const uploadedDocuments: FileNode[] = response.data.documents.map(
        (doc: any) => ({
          id: doc.id,
          parentId: doc.parent_id,
          name: doc.name,
          type: doc.type,
          url: doc.url,
        })
      );

      // Add files to Redux store
      dispatch(addFiles(uploadedDocuments));
      console.log(uploadedDocuments);
      setUploadedCount(uploadedDocuments.length);
      setUploadComplete(true);
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to upload files';
      alert(`Upload failed: ${errorMessage}`);
      handleClose();
    } finally {
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="p-2 cursor-pointer hover:bg-gray-200 rounded-lg">
        <label
          className={`text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {parentId ? (
            <HugeiconsIcon
              onClick={e => e.stopPropagation()}
              icon={PlusSignIcon}
              className="mr-2 h-4 w-4 flex-shrink-0 text-slate-900"
            />
          ) : (
            <HugeiconsIcon icon={FileImportIcon} size={18} />
          )}

          <input
            accept=".pdf,application/pdf"
            className="hidden"
            multiple
            onChange={handleFileUpload}
            type="file"
            disabled={isUploading}
          />
        </label>
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-96 shadow-lg overflow-hidden">
            {uploadComplete ? (
              // Success state
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Upload Complete!
                      </h3>
                      <p className="text-sm text-gray-600">
                        Successfully uploaded {uploadedCount} file
                        {uploadedCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              // Uploading state
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Uploading files...
                  </h3>
                  <span className="text-sm font-medium text-gray-600">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Please don't close this window
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImportDocuments;
