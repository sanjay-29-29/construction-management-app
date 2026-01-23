import { Preferences } from '@capacitor/preferences';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ROLES } from '@/constants/role.constants';

import { AuthContext } from './auth.context';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { isAuth, setIsAuth, user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    queryClient.removeQueries({
      predicate: () => true,
    });
    Preferences.clear();
    setIsAuth(false);
    setUser(undefined);
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  }, [queryClient, setIsAuth, setUser, navigate]);

  const isHeadOffice = useMemo<boolean>(
    () => user?.role === ROLES.HEAD_OFFICE || user?.role === ROLES.ADMIN,
    [user]
  );

  const isAdmin = useMemo(() => user?.role === ROLES.ADMIN, [user]);

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
