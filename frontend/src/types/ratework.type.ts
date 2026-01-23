export type RateWork = {
  id: string;
  dateCreated: string;
  name: string;
  quantity: number;
  costPerUnit: number;
  isCompleted: boolean;
  labourName: string;
  totalCost: number;
  unit: string;
  paid: number;
};

export type RateWorkPayment = {
  note: string;
  amount: string;
  dateCreated: string;
  id: string;
};
