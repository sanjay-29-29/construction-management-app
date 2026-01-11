export type Labour = {
  id: string;
  name: string;
  type: string;
  gender: string;
  weekLinkId?: string;
  openingBalance?: number;
  weeklyDailyWage?: number;
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
