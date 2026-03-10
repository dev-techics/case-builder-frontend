import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRequestPasswordResetMutation } from '../api';
import { getErrorMessage } from '../utils';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const useForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestReset, { isLoading, error, reset }] =
    useRequestPasswordResetMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setValidationError(null);
    reset();

    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    try {
      await requestReset({ email }).unwrap();
      setSubmitted(true);
      toast.success(
        'If an account exists for this email, a reset link has been sent.'
      );
    } catch {
      // Error is handled via RTK Query state.
    }
  };

  return {
    email,
    setEmail: (value: string) => {
      setEmail(value);
      if (submitted) {
        setSubmitted(false);
      }
      if (validationError) {
        setValidationError(null);
      }
      reset();
    },
    submitted,
    handleSubmit,
    isSubmitting: isLoading,
    error: validationError ?? getErrorMessage(error),
  };
};

export default useForgotPasswordForm;
