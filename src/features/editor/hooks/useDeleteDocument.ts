import { useEffect, useRef, useState } from 'react';
import { useDeleteDocumentMutation } from '@/features/file-explorer/api';

type DeleteStatus = 'idle' | 'deleting' | 'success' | 'error';

type UseDeleteDocumentOptions = {
  documentId: string | number;
  onClose?: () => void;
};

export const useDeleteDocument = ({
  documentId,
  onClose,
}: UseDeleteDocumentOptions) => {
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');
  const timeoutRef = useRef<number | null>(null);

  const clearDeleteTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const resetDeleteState = () => {
    clearDeleteTimeout();
    setDeleteStatus('idle');
  };

  const handleDelete = async () => {
    if (isDeleting || deleteStatus === 'deleting') {
      return;
    }

    try {
      setDeleteStatus('deleting');
      await deleteDocument({ documentId: String(documentId) }).unwrap();
      console.log('File deleted successfully');
      setDeleteStatus('success');
      clearDeleteTimeout();
      timeoutRef.current = window.setTimeout(() => {
        onClose?.();
        setDeleteStatus('idle');
        timeoutRef.current = null;
      }, 3000);
    } catch (err) {
      console.log(err);
      setDeleteStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      clearDeleteTimeout();
    };
  }, []);

  useEffect(() => {
    setDeleteStatus('idle');
  }, [documentId]);

  const deleteMessage =
    deleteStatus === 'success'
      ? 'Document deleted successfully.'
      : deleteStatus === 'error'
        ? 'Failed to delete document.'
        : undefined;

  return {
    deleteStatus,
    deleteMessage,
    handleDelete,
    resetDeleteState,
  };
};
