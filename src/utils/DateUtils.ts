// -----------------------------------------------------------------------
// Single source for all date/time formatting and range math used across
// the app — screens, hooks, and aggregation all import from here instead
// of each defining their own local date helpers.
// -----------------------------------------------------------------------

// Converts a JS Date into the "YYYY-MM-DD" format the API expects.
export const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

// Converts a 24-hour "HH:mm" string (e.g. "10:56", "19:14") into a
// friendly 12-hour label (e.g. "10:56 AM", "7:14 PM"). Returns a fallback
// for empty/invalid input instead of throwing.
export const formatTime = (time: string | undefined, fallback = '--:--'): string => {
  if (!time) return fallback;

  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return fallback;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const paddedMinutes = String(minutes).padStart(2, '0');

  return `${hour12}:${paddedMinutes} ${period}`;
};

// Monday-to-Sunday range containing the given date ("YYYY-MM-DD" in, "YYYY-MM-DD" out).
export const getWeekRange = (anyDateInWeek: string): { fromDate: string; toDate: string } => {
  const d = new Date(anyDateInWeek);
  const day = d.getDay() || 7; // Sunday -> 7
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { fromDate: toDateString(monday), toDate: toDateString(sunday) };
};

// 1st-to-last-day range for the month containing the given date.
export const getMonthRange = (anyDateInMonth: string): { fromDate: string; toDate: string } => {
  const d = new Date(anyDateInMonth);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); // day 0 of next month = last day of this month
  return { fromDate: toDateString(first), toDate: toDateString(last) };
};

// Inclusive day count between two "YYYY-MM-DD" dates.
export const daysBetweenInclusive = (fromDate: string, toDate: string): number => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
};

// "July" from a "YYYY-MM-DD" string.
export const getMonthName = (anyDateInMonth: string): string =>
  new Date(anyDateInMonth).toLocaleDateString('en-US', { month: 'long' });

// 2026 from a "YYYY-MM-DD" string.
export const getYear = (anyDate: string): number => new Date(anyDate).getFullYear();