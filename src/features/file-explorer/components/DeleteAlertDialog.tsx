import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// import type { FileNode } from '@/features/file-explorer/types/types';

interface DeleteAlertDialogProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  onDelete: () => void;
  file?: any;
  status?: 'idle' | 'deleting' | 'success' | 'error';
  message?: string;
}

const DeleteAlertDialog = ({
  open,
  onOpen,
  onDelete,
  file,
  status = 'idle',
  message,
}: DeleteAlertDialogProps) => {
  const isDeleting = status === 'deleting';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const handleConfirmDelete = () => {
    onDelete();
  };

  const title = isSuccess
    ? 'Document Deleted'
    : isError
      ? 'Delete Failed'
      : 'Delete File';

  const description = isSuccess
    ? message || 'Document deleted successfully.'
    : isError
      ? message || 'Failed to delete document.'
      : `Are you sure you want to delete "${file?.name}"? This action cannot be undone.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isSuccess || isError ? (
            <AlertDialogAction>Close</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAlertDialog;
