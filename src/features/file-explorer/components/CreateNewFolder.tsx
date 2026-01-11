import { FolderAddIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState, useRef, useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { createFolder } from '@/features/file-explorer/redux/fileTreeSlice';
import { useParams } from 'react-router-dom';

interface CreateNewFolderProps {
  parentId?: string | null;
}

const CreateNewFolder = ({ parentId = null }: CreateNewFolderProps) => {
  const dispatch = useAppDispatch();
  const { bundleId } = useParams<{ bundleId: string }>();
  const [isCreating, setIsCreating] = useState(false);
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreateClick = () => {
    setIsCreating(true);
    setFolderName('New Folder');
  };

  const handleSubmit = async () => {
    const trimmedName = folderName.trim();
    if (trimmedName && bundleId) {
      try {
        await dispatch(
          createFolder({
            bundleId,
            name: trimmedName,
            parentId,
          })
        ).unwrap();
        setFolderName('');
        setIsCreating(false);
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    } else {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFolderName('');
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  if (isCreating) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 absolute left-0 -bottom-8">
        <input
          ref={inputRef}
          type="text"
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 text-sm bg-white border border-blue-500 rounded px-2 py-1 outline-none"
          placeholder="Folder name"
        />
      </div>
    );
  }

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
