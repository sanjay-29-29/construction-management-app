import type { User } from './user.type';

export type Site = {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  supervisors: User[] | undefined;
};
