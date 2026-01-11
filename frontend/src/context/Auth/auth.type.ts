import type { User } from '@/types';

import type { Dispatch, SetStateAction } from 'react';

export type Auth = {
  isAuth: boolean;
  setIsAuth: Dispatch<SetStateAction<boolean>>;
  user: User | undefined;
  setUser: Dispatch<SetStateAction<User | undefined>>;
};
