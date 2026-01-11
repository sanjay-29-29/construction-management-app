import { createContext } from 'react';

import type { Auth } from './auth.type';

export const AuthContext = createContext<Auth>({
  isAuth: false,
  setIsAuth: () => {},
  user: undefined,
  setUser: () => {},
});
