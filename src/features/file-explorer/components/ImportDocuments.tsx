import type React from 'react';
import { FileImportIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, AlertCircle, CirclePlus } from 'lucide-react';
import { useImportDocumentsUpload } from '../hooks';
import { useRef } from 'react';
import { getConversionStatusClasses } from '../utils';

interface ImportDocumentsProps {
  bundleId: string;
  parentId?: string | null;
  variant?: 'header' | 'icon';
}

const ImportDocuments: React.FC<ImportDocumentsProps> = ({
  bundleId,
  parentId = null,
  variant = 'icon',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    conversionStatuses,
    handleClose,
    handleFileUpload,
    hasConversions,
    isUploading,
    uploadComplete,
    uploadProgress,
    uploadedCount,
  } = useImportDocumentsUpload({ bundleId, parentId });

  const buttonCursorClass = isUploading
    ? 'cursor-not-allowed opacity-50'
    : 'cursor-pointer';

  let buttonContent: React.ReactNode;

  if (variant === 'header') {
    buttonContent = (
      <>
        <CirclePlus className="h-5 w-5" />
        File
      </>
    );
  } else if (parentId) {
    buttonContent = (
      <HugeiconsIcon
        icon={PlusSignIcon}
        className="mr-2 h-4 w-4 flex-shrink-0 text-slate-900"
      />
    );
  } else {
    buttonContent = <HugeiconsIcon icon={FileImportIcon} size={18} />;
  }

  // Supported file types
  const SUPPORTED_FORMATS = {
    pdf: '.pdf',
    images: '.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp',
    documents: '.doc,.docx,.txt,.rtf,.odt',
    presentations: '.ppt,.pptx,.odp',
    spreadsheets: '.xls,.xlsx,.ods',
  };

  const ALL_SUPPORTED_FORMATS = Object.values(SUPPORTED_FORMATS).join(',');

  return (
    <>
      <button
        type="button"
        className={
          variant === 'header'
            ? `flex h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/20 px-3 font-medium text-indigo-700 text-sm shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 ${buttonCursorClass}`
            : `block rounded-lg p-2 text-sm hover:bg-gray-200 ${buttonCursorClass}`
        }
        onClick={e => {
          e.stopPropagation();
          if (!isUploading) {
            fileInputRef.current?.click();
          }
        }}
        title="Import Document"
        aria-label="Import Document"
        disabled={isUploading}
      >
        {buttonContent}
      </button>

      <input
        ref={fileInputRef}
        accept={ALL_SUPPORTED_FORMATS}
        className="hidden"
        multiple
        onChange={handleFileUpload}
        type="file"
        disabled={isUploading}
      />

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-[480px] max-h-[80vh] shadow-lg overflow-hidden flex flex-col">
            {uploadComplete ? (
              // Success state
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Upload Complete!
                      </h3>
                      <p className="text-sm text-gray-600">
                        Successfully processed {uploadedCount} file
                        {uploadedCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Conversion statuses */}
                {conversionStatuses.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Conversion Results:
                    </p>
                    {conversionStatuses.map(status => (
                      <div
                        key={status.id}
                        className={`flex items-start gap-2 p-2 rounded text-xs ${getConversionStatusClasses(
                          status.status
                        )}`}
                      >
                        {status.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        )}
                        {status.status === 'failed' && (
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {status.fileName}
                          </p>
                          {status.message && (
                            <p className="text-xs opacity-80">
                              {status.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              // Uploading state
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {hasConversions
                      ? 'Converting and uploading...'
                      : 'Uploading files...'}
                  </h3>
                  <span className="text-sm font-medium text-gray-600">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  {hasConversions
                    ? 'Converting files to PDF format...'
                    : "Please don't close this window"}
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
