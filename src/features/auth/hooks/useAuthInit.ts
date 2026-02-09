import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { fetchUser } from '../redux/authSlice';
import { authApi } from '../api/authApi';

const useAuthInit = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If token exists in localStorage, fetch user data
    if (authApi.isAuthenticated()) {
      dispatch(fetchUser());
    }
  }, [dispatch]);
};

export default useAuthInit;
