import DeleteAlertDialog from '@/features/file-explorer/components/DeleteAlertDialog';
import { Check, FileText, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useDeleteDocument, useRename } from '@/features/editor/hooks';
import type { FileTreeFileNode } from '@/features/file-explorer/types/fileTree';

type PdfHeaderProps = {
  file: FileTreeFileNode;
  rotation: number;
};

const PdfHeader = ({ file }: PdfHeaderProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

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
    // isRenaming,
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
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3 gap-2">
        {/* --------- File icon & Name ------------- */}
        <div className="flex w-full items-center gap-2 min-w-0">
          <div>
            <FileText className="h-5 w-5 text-red-500" />
          </div>

          {/*----------------------- 
              Rename input field
          --------------------------*/}
          {isRenamingLocal ? (
            <div className="flex w-full items-center gap-1 min-w-0">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                className="h-7 w-full min-w-[180px] rounded border border-blue-500 bg-white px-2 text-sm text-gray-800 outline-none"
              />
              <button
                aria-label="Save file name"
                className="rounded p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                // disabled={isRenaming}
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
              className="group inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-gray-200 overflow-hidden"
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
        {/* ---------- Rotate & delete button ---------*/}
        <div className="flex items-center gap-2">
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
