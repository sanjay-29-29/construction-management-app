import type { User } from './user.type';

export type Image = {
  id: string;
  image: string;
};

export type Material = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  receivedQuantity: number;
};

export type Order = {
  id: string;
  name: string;
  number: string;
  vendor: string;
  site: string;
  createdAt: string;
  materials: Material[];
  isCompleted: boolean;
  cost: number;
  remarks?: string;
  completedBy?: User;
  images?: Image[];
  paid: number;
};
