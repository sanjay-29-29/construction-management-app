export type RateWork = {
  id: string;
  name: string;
  quantity: number;
  costPerUnit: number;
  isCompleted: boolean;
  labourName: string;
  unit: string;
  paid: number;
  payments: Payment[];
};

export type Payment = {
  note: string;
  amount: string;
  dateCreated: string;
  id: string;
};
