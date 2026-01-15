import { FolderAddIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useAppDispatch } from '@/app/hooks';
import { setIsCreatingNewFolder } from '@/features/file-explorer/redux/fileTreeSlice';

const CreateNewFolder = () => {
  const dispatch = useAppDispatch();

  const handleCreateClick = () => {
    console.log('create folder clicked');
    dispatch(setIsCreatingNewFolder(true));
  };

  return (
    <div className="cursor-pointer hover:bg-gray-200 p-2 rounded-lg">
      <HugeiconsIcon
        onClick={handleCreateClick}
        icon={FolderAddIcon}
        size={18}
      />
    </div>
  );
};

export default CreateNewFolder;
