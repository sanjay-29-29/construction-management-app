import { Preferences } from '@capacitor/preferences';
import { useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ROLES } from '@/constants/role.constants';

import { AuthContext } from './auth.context';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { isAuth, setIsAuth, user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = () => {
    queryClient.removeQueries({
      predicate: () => true,
    });
    Preferences.clear();
    setIsAuth(false);
    setUser(undefined);
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const isHeadOffice =
    user?.role === ROLES.HEAD_OFFICE || user?.role === ROLES.ADMIN;

  const isAdmin = user?.role === ROLES.ADMIN;

  return {
    isAuth,
    setIsAuth,
    user,
    setUser,
    logout,
    isHeadOffice,
    isAdmin,
  };
};
