/**
 * File action menu
 *
 * Responsibilites:
 * Display file action menu and handle file rename and delete logic
 *
 * Notes: Need Testing
 *
 * Author: Anik Dey
 *
 */
import { EllipsisIcon, Pencil, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAppDispatch } from '@/app/hooks';
import { deleteDocument, type Children } from '../fileTreeSlice';
import { useState } from 'react';

interface FileActionMenuProps {
  file: Children;
  onRenameClick: () => void;
}

const FileActionMenu = ({ file, onRenameClick }: FileActionMenuProps) => {
  const dispatch = useAppDispatch();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // const bundleId = useParams<{ bundleId: string }>().bundleId || '';

  const handleRename = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    onRenameClick();
  };

  const handleDeleteClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    dispatch(deleteDocument({ documentId: file.id }));
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Open edit menu" size="icon" variant="ghost">
            <EllipsisIcon aria-hidden="true" size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" sideOffset={20}>
          <DropdownMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
              handleRename(e)
            }
          >
            <Pencil className="ml-1" size={16} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
              handleDeleteClick(e)
            }
          >
            <Trash2Icon className="ml-1" size={16} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{file.name}"? This action cannot
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
    </>
  );
};

export default FileActionMenu;
