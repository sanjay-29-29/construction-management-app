import type { RateWork, RateWorkPayment } from './ratework.type';

export type Document = {
  document: string;
  fileName: string;
  id: string;
};

export type Labour = {
  id: string;
  name: string;
  type: string;
  gender: string;
  weekLinkId?: string;
  photo?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  branchName?: string;
  ifscCode?: string;
  openingBalance?: number;
  weeklyDailyWage?: number;
  totalDueToDate?: number;
  panNumber?: string;
  paymentType?: number;
  documents?: Document[];
  rateWorks?: RateWork[];
  rateWorkPayments?: RateWorkPayment[];
  rateWorkPaymentTotal?: number;
  amountPaid?: number;
};

export type AttendanceEntry = {
  advanceTaken: number;
  paymentType?: number;
  isPresent: boolean;
  labour: string;
};

export type DailyEntry = {
  id: string;
  date: string;
  attendance: AttendanceEntry[];
  labours: [];
  isEditable: boolean;
};

export type Week = {
  id: string;
  labours?: Labour[];
  dailyEntry?: DailyEntry[];
  startDate: string;
  payments?: WeekPayment;
  endDate: string;
  isEditable: boolean;
};

export type Payment = {
  labour: string;
  amountPaid: number;
};

export type WeekPayment = {
  id: string;
  isEditable: boolean;
  payments: Payment[];
};
