import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../api';
import type { RegisterCredentials } from '../types/types';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '../redux/authSlice';
import { getErrorMessage } from '../utils/index';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const useRegister = () => {
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [registerUser, { isLoading, error, reset }] = useRegisterMutation();

  const showPasswordMismatch =
    formData.password_confirmation !== '' &&
    formData.password !== formData.password_confirmation;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (validationError) {
      setValidationError(null);
    }
    reset();
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.password_confirmation
    ) {
      return;
    }

    setValidationError(null);
    reset();

    if (!isValidEmail(formData.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      const data = await registerUser(formData).unwrap();
      if (data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data?.user) {
        dispatch(setUser(data.user));
      }
      navigate('/login', { state: { fromRegister: true } });
    } catch {
      // Error is handled via RTK Query state.
    }
  };

  return {
    formData,
    handleChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
    isLoading,
    error: validationError ?? getErrorMessage(error),
    showPasswordMismatch,
  };
};

export default useRegister;
