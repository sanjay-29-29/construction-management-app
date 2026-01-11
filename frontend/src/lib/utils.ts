import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined) {
  if (!date) return '';
  date = new Date(date);
  return date.toLocaleDateString('en-In', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const formatNumber = (amount: number | string | undefined): string => {
  if (!amount) {
    return '0.00';
  }
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericValue)) return '0.00';

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};
