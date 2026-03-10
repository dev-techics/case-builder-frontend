import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../api';
import { getErrorMessage } from '../utils';

const useResetPasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [resetPassword, { isLoading, error, reset }] =
    useResetPasswordMutation();

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationError(null);
    setSuccess('');
    reset();

    if (!newPassword || !confirmNewPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (email == null || token == null) {
      setValidationError('Invalid token');
      return;
    }

    try {
      const response = await resetPassword({
        email,
        token,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      }).unwrap();
      setSuccess(response.message || 'Password reset successfully.');
    } catch {
      // Error is handled via RTK Query state.
    }
  };

  return {
    newPassword,
    setNewPassword: (value: string) => {
      setNewPassword(value);
      if (validationError) setValidationError(null);
      reset();
    },
    confirmNewPassword,
    setConfirmNewPassword: (value: string) => {
      setConfirmNewPassword(value);
      if (validationError) setValidationError(null);
      reset();
    },
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
    loading: isLoading,
    error: validationError ?? getErrorMessage(error),
    success,
  };
};

export default useResetPasswordForm;
