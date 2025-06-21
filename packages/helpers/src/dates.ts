import { format, formatDate as __formatDate } from 'date-fns';

export function formatDate(date: Date | string | number): string {
  return __formatDate(new Date(date), 'dd MMMM yyyy');
}

export function formatShortDate(date: Date | string | number): string {
  return __formatDate(new Date(date), 'dd MMMM');
}

export function resetTime(date: Date, endOfDay = false): Date {
  const newDate = new Date(date.getTime());

  if (endOfDay) {
    newDate.setHours(23, 0, 0, 0);
  } else {
    newDate.setHours(0, 0, 0, 0);
  }

  return newDate;
}

export function toServerDate(date: Date | string | number): string {
  return __formatDate(date, 'yyyy-MM-dd HH:mm:ss.SSS');
}

export function toServerDateOrNull(date: Date | string | number | null): string | null {
  if (date) return toServerDate(date);
  return null;
}

export function fromServerDate(date: string): Date {
  const __date = new Date(date.split(' ')[0]!);
  const __time = date.split(' ')[1]!;
  const [hours, minutes] = __time.split(':');
  __date.setHours(Number(hours!), Number(minutes!));
  return __date;
}

export const PLANET_SCALE_DATE_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/;

export function formatTime(date: string) {
  return format(fromServerDate(date), 'HH:mm');
}

export function parseTime(time: string) {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number) as  [number, number];
  now.setHours(hours);
  now.setMinutes(minutes);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};
