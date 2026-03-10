import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../api';
import type { AuthCredentials } from '../types/types';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '../redux/authSlice';
import { getErrorMessage } from '../utils/index';

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const useLoginForm = () => {
  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading, error, reset }] = useLoginMutation();

  /*------------------------------
    Handle login form submission
  -------------------------------*/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return;

    setValidationError(null);
    reset();

    const loginCredentials: AuthCredentials = {
      email,
      password,
    };

    if (!isValidEmail(loginCredentials.email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (loginCredentials.password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    try {
      const data = await login(loginCredentials).unwrap();
      if (data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data?.user) {
        dispatch(setUser(data.user));
      }
      navigate('/dashboard');
    } catch {
      // Error is handled via RTK Query state.
    }
  };

  return {
    email,
    setEmail: (value: string) => {
      setValidationError(null);
      setEmail(value);
    },
    password,
    setPassword: (value: string) => {
      setValidationError(null);
      setPassword(value);
    },
    showPassword,
    setShowPassword,
    handleSubmit,
    isLoading,
    error: validationError ?? getErrorMessage(error),
  };
};

export default useLoginForm;
