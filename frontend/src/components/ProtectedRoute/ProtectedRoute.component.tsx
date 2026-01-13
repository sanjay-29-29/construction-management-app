import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import { useAuth } from '@/context/Auth';
import type { User } from '@/types';

import { LoaderPage } from '../LoaderPage';

export const ProtectedRoute = () => {
  const { isAuth, setIsAuth, user, setUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const verifyUserToken = async () => {
    if (isAuth && user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await client.get<User>('user/');
      setUser(response.data);
      setIsAuth(true);
    } catch (error) {
      logout();
      if (isAxiosError(error)) {
        navigate('/login');
        return;
      }
      navigate('/login');
      toast.error('Unknown Error Occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyUserToken();
  }, []);

  if (isLoading) {
    return <LoaderPage />;
  }

  return isAuth ? <Outlet /> : null;
};
