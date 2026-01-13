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
  documents?: Document[];
};

export type AttendanceEntry = {
  advanceTaken: number;
  isPresent: boolean;
  labour: string;
  wageForDay: number;
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
  endDate: string;
};
