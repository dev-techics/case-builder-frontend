import { useCallback, useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';

import type { Bundle, CreateBundleDto } from '../types';

type CreateBundleApi = (bundleData: CreateBundleDto) => Promise<Bundle>;

type UseCreateBundleDialogOptions = {
  createBundle: CreateBundleApi;
  onCreated?: (bundle: Bundle) => void;
};

export const useCreateBundleDialog = ({
  createBundle,
  onCreated,
}: UseCreateBundleDialogOptions) => {
  const [bundleName, setBundleName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [description, setDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setBundleName('');
    setCaseNumber('');
    setDescription('');
  }, []);

  const openCreateDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isSubmitting) {
        return;
      }

      setIsDialogOpen(open);

      if (!open) {
        resetForm();
      }
    },
    [isSubmitting, resetForm]
  );

  const handleBundleNameChange = useCallback((value: string) => {
    setBundleName(value);
  }, []);

  const handleCaseNumberChange = useCallback((value: string) => {
    setCaseNumber(value);
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
  }, []);

  const canSubmit =
    Boolean(bundleName.trim()) && Boolean(caseNumber.trim()) && !isSubmitting;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!canSubmit) {
        return;
      }

      setIsSubmitting(true);

      try {
        const createdBundle = await createBundle({
          name: bundleName.trim(),
          caseNumber: caseNumber.trim(),
          description: description.trim() || undefined,
        });

        toast.success('New bundle created successfully');
        resetForm();
        setIsDialogOpen(false);
        onCreated?.(createdBundle);
      } catch {
        toast.error('Failed to create bundle');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      bundleName,
      canSubmit,
      caseNumber,
      createBundle,
      description,
      onCreated,
      resetForm,
    ]
  );

  return {
    bundleName,
    canSubmit,
    caseNumber,
    description,
    handleBundleNameChange,
    handleCaseNumberChange,
    handleDescriptionChange,
    handleOpenChange,
    handleSubmit,
    isDialogOpen,
    isSubmitting,
    openCreateDialog,
  };
};
