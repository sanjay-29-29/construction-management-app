export const ROLES = {
  HEAD_OFFICE: 'Head Office',
  SITE_ENGINEER: 'Site Engineer',
} as const;

export const ROLES_DROPDOWN = [
  { value: '1', label: 'Head Office' },
  { value: '2', label: 'Site Engineer' },
] as const;

export const LABOUR_ROLES = {
  DAILY_WORKER: 'Daily Work',
  RATE_WORKER: 'Rate Work',
} as const;

export const LABOUR_DROPDOWN = [
  { value: '1', label: 'Daily Work' },
  { value: '2', label: 'Rate Work' },
] as const;

export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
};

export const GENDER_DROPDOWN = [
  { value: '1', label: 'Male' },
  { value: '2', label: 'Female' },
] as const;
