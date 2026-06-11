import { FolderPlus } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { setIsCreatingNewFolder } from '@/features/file-explorer/redux/fileTreeSlice';

type CreateNewFolderProps = {
  variant?: 'icon' | 'header';
};

const CreateNewFolder = ({ variant = 'icon' }: CreateNewFolderProps) => {
  const dispatch = useAppDispatch();

  const handleCreateClick = () => {
    dispatch(setIsCreatingNewFolder(true));
  };

  if (variant === 'header') {
    return (
      <button
        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/20 px-3 font-medium text-indigo-700 text-sm shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:pointer-events-none disabled:opacity-60"
        onClick={handleCreateClick}
        type="button"
      >
        <FolderPlus className="h-5 w-5" />
        Folder
      </button>
    );
  }

  return (
    <button
      aria-label="Create folder"
      className="cursor-pointer rounded-lg p-2 hover:bg-gray-200"
      onClick={handleCreateClick}
      type="button"
    >
      <FolderPlus className="h-4 w-4" />
    </button>
  );
};

export default CreateNewFolder;
