import { useState, type ReactNode } from 'react';

import type { User } from '@/types';

import { AuthContext } from './auth.context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<User | undefined>();

  return (
    <AuthContext value={{ isAuth, setIsAuth, user, setUser }}>
      {children}
    </AuthContext>
  );
};
