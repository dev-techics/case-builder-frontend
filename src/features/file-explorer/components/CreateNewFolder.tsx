import { FolderAddIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const CreateNewFolder = () => {
  return (
    <div className="cursor-pointer hover:bg-gray-200 p-2 rounded-lg">
      <HugeiconsIcon icon={FolderAddIcon} size={18} />
    </div>
  );
};

export default CreateNewFolder;
