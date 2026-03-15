import DeleteAlertDialog from '@/features/file-explorer/components/DeleteAlertDialog';
import {
  Check,
  FileText,
  Pencil,
  Trash2,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectIsRotating } from '@/features/file-explorer/redux/fileTreeSlice';
import { useDeleteDocument, useRename } from '@/features/editor/hooks';

type PdfHeaderProps = {
  file: any;
  rotation: number;
  scale: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canResetZoom: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
};

const PdfHeader = ({
  file,
  rotation,
  onRotateLeft,
  onRotateRight,
}: PdfHeaderProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const isRotating = useAppSelector(state => selectIsRotating(state, file.id));

  // delete document hook
  const { deleteStatus, deleteMessage, handleDelete, resetDeleteState } =
    useDeleteDocument({
      documentId: file.id,
      onClose: () => setShowDeleteDialog(false),
    });

  // rename document hook
  const {
    isRenamingLocal,
    renameValue,
    setRenameValue,
    renameInputRef,
    isRenaming,
    startRename,
    handleRenameCancel,
    handleRenameSubmit,
    handleRenameKeyDown,
  } = useRename({
    documentId: file.id,
    fileName: file.name,
  });

  const openDeleteDialog = () => {
    resetDeleteState();
    setShowDeleteDialog(true);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) {
      resetDeleteState();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        {/* --------- File icon & Name ------------- */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-red-500" />

          {/*----------------------- 
              Rename input field
          --------------------------*/}
          {isRenamingLocal ? (
            <div className="flex items-center gap-1 min-w-0">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                className="h-7 min-w-[180px] rounded border border-blue-500 bg-white px-2 text-sm text-gray-800 outline-none"
              />
              <button
                aria-label="Save file name"
                className="rounded p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                disabled={isRenaming}
                onClick={handleRenameSubmit}
                type="button"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                aria-label="Cancel rename"
                className="rounded p-1 text-gray-600 hover:bg-gray-200"
                onClick={handleRenameCancel}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* ----------- Edit button ----------*/
            <button
              className="group inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-gray-200"
              onClick={startRename}
              type="button"
            >
              <span
                className="truncate font-medium text-gray-700"
                title={file.name}
              >
                {file.name}
              </span>
              <Pencil className="h-3.5 w-3.5 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
            <button
              aria-label="Rotate left"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRotating}
              onClick={onRotateLeft}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="min-w-[44px] text-center text-gray-600 text-xs font-medium">
              {rotation}deg
            </span>
            <button
              aria-label="Rotate right"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRotating}
              onClick={onRotateRight}
              type="button"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
          {/*--------------------- 
                Delete Button
            ----------------------*/}
          <button
            onClick={openDeleteDialog}
            className="rounded p-1 hover:bg-gray-200"
            type="button"
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      {/* --------------------------- 
          Delete Confirmation Dialog
          --------------------------- */}
      <DeleteAlertDialog
        open={showDeleteDialog}
        onOpen={handleDeleteDialogOpenChange}
        onDelete={handleDelete}
        file={file}
        status={deleteStatus}
        message={deleteMessage}
      />
    </>
  );
};

export default PdfHeader;
