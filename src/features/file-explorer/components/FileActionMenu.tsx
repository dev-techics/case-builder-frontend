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
import { EllipsisIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Children } from '../redux/fileTreeSlice';
import { useState } from 'react';
import { Delete03Icon, Edit03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import DeleteAlertDialog from './DeleteAlertDialog';
import { useDeleteDocumentMutation } from '../api';

interface FileActionMenuProps {
  file: Children;
  onRenameClick: () => void;
}

const FileActionMenu = ({ file, onRenameClick }: FileActionMenuProps) => {
  const [deleteDocument] = useDeleteDocumentMutation();
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
    deleteDocument({ documentId: file.id });
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
            <HugeiconsIcon className="ml-1" size={16} icon={Edit03Icon} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
              handleDeleteClick(e)
            }
          >
            <HugeiconsIcon
              className="ml-1 text-red-500"
              size={16}
              icon={Delete03Icon}
            />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* -------- Confirmation Dialog for deleting file --------- */}
      <DeleteAlertDialog
        open={showDeleteDialog}
        onOpen={setShowDeleteDialog}
        onDelete={handleConfirmDelete}
        file={file}
      />
    </>
  );
};

export default FileActionMenu;
