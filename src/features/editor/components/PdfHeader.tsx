import DeleteAlertDialog from '@/features/file-explorer/components/DeleteAlertDialog';
import {
  Check,
  FileText,
  Pencil,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  deleteDocument,
  renameDocument,
  selectIsRenaming,
} from '@/features/file-explorer/redux/fileTreeSlice';

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
  const [isRenamingLocal, setIsRenamingLocal] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const isRenaming = useAppSelector(state => selectIsRenaming(state, file.id));

  useEffect(() => {
    setRenameValue(file.name);
  }, [file.name]);

  useEffect(() => {
    if (isRenamingLocal && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenamingLocal]);

  const handleFileDelete = async () => {
    try {
      await dispatch(deleteDocument({ documentId: file.id })).unwrap();
      console.log('File deleted successfully');
      setShowDeleteDialog(false);
    } catch (err: any) {
      console.log(err);
    }
  };

  const startRename = () => {
    setRenameValue(file.name);
    setIsRenamingLocal(true);
  };

  const handleRenameCancel = () => {
    setRenameValue(file.name);
    setIsRenamingLocal(false);
  };

  const handleRenameSubmit = async () => {
    const trimmedValue = renameValue.trim();
    if (!trimmedValue || trimmedValue === file.name) {
      setIsRenamingLocal(false);
      return;
    }

    try {
      await dispatch(
        renameDocument({ documentId: file.id, newName: trimmedValue })
      ).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      setIsRenamingLocal(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleRenameCancel();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        {/* --------- File icon & Name ------------- */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-red-500" />
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
            <button
              className="group inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-gray-200"
              onClick={startRename}
              type="button"
            >
              <span className="truncate font-medium text-gray-700" title={file.name}>
                {file.name}
              </span>
              <Pencil className="h-3.5 w-3.5 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
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
