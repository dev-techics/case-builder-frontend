import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
// import { useAppSelector } from '@/app/hooks';
// import { selectIsRenaming } from '@/features/file-explorer/redux/fileTreeSlice';
import { useRenameDocumentMutation } from '@/features/file-explorer/api';

type UseRenameOptions = {
  documentId: string | number;
  fileName: string;
};

export const useRename = ({ documentId, fileName }: UseRenameOptions) => {
  const [isRenamingLocal, setIsRenamingLocal] = useState(false);
  const [renameValue, setRenameValue] = useState(fileName);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [renameDocument] = useRenameDocumentMutation();
  // const isRenaming = useAppSelector(state =>
  //   selectIsRenaming(state, String(documentId))
  // );

  useEffect(() => {
    setRenameValue(fileName);
  }, [fileName]);

  useEffect(() => {
    if (isRenamingLocal && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenamingLocal]);

  const startRename = () => {
    setRenameValue(fileName);
    setIsRenamingLocal(true);
  };

  const handleRenameCancel = () => {
    setRenameValue(fileName);
    setIsRenamingLocal(false);
  };

  const handleRenameSubmit = async () => {
    const trimmedValue = renameValue.trim();
    if (!trimmedValue || trimmedValue === fileName) {
      setIsRenamingLocal(false);
      return;
    }

    try {
      await renameDocument({
        documentId: String(documentId),
        newName: trimmedValue,
      }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      setIsRenamingLocal(false);
    }
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

  return {
    isRenamingLocal,
    renameValue,
    setRenameValue,
    renameInputRef,
    // isRenaming,
    startRename,
    handleRenameCancel,
    handleRenameSubmit,
    handleRenameKeyDown,
  };
};
