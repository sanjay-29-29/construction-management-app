import { Preferences } from '@capacitor/preferences';
import { useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { AuthContext } from './auth.context';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { isAuth, setIsAuth, user, setUser } = useContext(AuthContext);

  const clearAuth = () => {
    queryClient.removeQueries({
      predicate: () => true,
    });
    Preferences.clear();
    setIsAuth(false);
    setUser(undefined);
  };

  return {
    isAuth,
    setIsAuth,
    user,
    setUser,
    clearAuth,
  };
};
