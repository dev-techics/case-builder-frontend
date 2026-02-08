import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createFolder, setIsCreatingNewFolder } from '../redux/fileTreeSlice';

interface CreateNewFolderProps {
  parentId?: string | null;
}

const CreateNewFolderInput = ({ parentId = null }: CreateNewFolderProps) => {
  const [folderName, setFolderName] = useState('New Folder');
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const { bundleId } = useParams<{ bundleId: string }>();
  const tree = useAppSelector(state => state.fileTree.tree);
  const isCreating = useAppSelector(
    state => state.fileTree.isCreatingNewFolder
  );

  const findNodeById = (
    children: typeof tree.children,
    id: string
  ): (typeof tree.children)[number] | null => {
    for (const child of children) {
      if (child.id === id) {
        return child;
      }
      if (child.type === 'folder' && child.children) {
        const found = findNodeById(child.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const parentNode =
    parentId && tree.children ? findNodeById(tree.children, parentId) : null;
  const resolvedParentId =
    parentNode?.type === 'folder' ? parentNode.id : null;
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmit = async () => {
    const trimmedName = folderName.trim();
    if (trimmedName && bundleId) {
      try {
        await dispatch(
          createFolder({
            bundleId,
            name: trimmedName,
            parentId: resolvedParentId,
          })
        ).unwrap();
        setFolderName('');
        dispatch(setIsCreatingNewFolder(false));
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    } else {
      // If name is empty, just cancel creation
      dispatch(setIsCreatingNewFolder(false));
    }
  };

  const handleCancel = () => {
    setFolderName('');
    dispatch(setIsCreatingNewFolder(false));
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

  return (
    <div className="flex items-center gap-2 px-2 py-1">
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
};

export default CreateNewFolderInput;
