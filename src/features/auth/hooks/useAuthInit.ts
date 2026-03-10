import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { isAuthenticated } from '../utils';
import { useGetUserQuery } from '../api';
import { setUser } from '../redux/authSlice';

const useAuthInit = () => {
  const dispatch = useAppDispatch();
  const hasToken = isAuthenticated();
  const { data, isError } = useGetUserQuery(undefined, {
    skip: !hasToken,
  });

  useEffect(() => {
    if (data?.user) {
      dispatch(setUser(data.user));
    }

    if (isError) {
      dispatch(setUser(null));
    }
  }, [data, isError, dispatch]);
};

export default useAuthInit;
