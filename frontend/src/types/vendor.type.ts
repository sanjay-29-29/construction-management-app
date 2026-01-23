import type { RateWorkPayment } from './ratework.type';

export type Vendor = {
  id: string;
  name: string;
  address: string;
  notes?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  gstNumber?: string;
  amountPaid?: number;
  orderCost?: number;
  payments?: RateWorkPayment[];
};
