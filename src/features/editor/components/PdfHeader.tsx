import DeleteAlertDialog from '@/features/file-explorer/components/DeleteAlertDialog';
import { FileText, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { deleteDocument } from '@/features/file-explorer/redux/fileTreeSlice';

type PdfHeaderProps = {
  file: any;
  scale: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canResetZoom: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

const PdfHeader = ({
  file,
  scale,
  canZoomIn,
  canZoomOut,
  canResetZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: PdfHeaderProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const handleFileDelete = async () => {
    try {
      await dispatch(deleteDocument({ documentId: file.id })).unwrap();
      console.log('File deleted successfully');
      setShowDeleteDialog(false);
    } catch (err: any) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        {/* --------- File icon & Name ------------- */}
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-500" />
          <span className="font-medium text-gray-700">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
            <button
              aria-label="Zoom out"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canZoomOut}
              onClick={onZoomOut}
              type="button"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[56px] text-center font-semibold text-gray-700 text-xs">
              {Math.round(scale * 100)}%
            </span>
            <button
              aria-label="Zoom in"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canZoomIn}
              onClick={onZoomIn}
              type="button"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              aria-label="Reset zoom"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canResetZoom}
              onClick={onResetZoom}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          {/* -------- Delete Button---------- */}
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="rounded p-1 hover:bg-gray-200"
            type="button"
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      {/* ------- Delete Confirmation Dialog ---------- */}
      <DeleteAlertDialog
        open={showDeleteDialog}
        onOpen={setShowDeleteDialog}
        onDelete={handleFileDelete}
        file={file}
      />
    </>
  );
};

export default PdfHeader;
