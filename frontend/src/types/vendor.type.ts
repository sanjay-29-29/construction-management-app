import type { Payment } from './ratework.type';

export type Vendor = {
  id: string;
  name: string;
  address: string;
  notes?: string;
  amountPaid?: number;
  orderCost?: number;
  payments?: Payment[];
};
