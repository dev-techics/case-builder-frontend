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
}

const DeleteAlertDialog = ({
  open,
  onOpen,
  onDelete,
  file,
}: DeleteAlertDialogProps) => {
  const handleConfirmDelete = () => {
    onDelete();
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete File</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{file?.name}"? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAlertDialog;
