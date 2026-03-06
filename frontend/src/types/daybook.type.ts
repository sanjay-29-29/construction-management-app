export type Head = {
  id: string;
  name: string;
  createdAt: string;
  isCommon: boolean;
  isDeleted: boolean;
  site: string | null;
};

export type Entry = {
  id: string;
  head: string;
  description: string;
  reference: string;
  paymentType: string;
  createdAt: string;
  createdBy: string;
  amountDb: string;
  amountCr: string;
};
