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

// 1st-to-last-day range for the month containing the given date.
export const getMonthRange = (anyDateInMonth: string): { fromDate: string; toDate: string } => {
  const d = new Date(anyDateInMonth);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); // day 0 of next month = last day of this month
  return { fromDate: toDateString(first), toDate: toDateString(last) };
};

// "July" from a "YYYY-MM-DD" string.
export const getMonthName = (anyDateInMonth: string): string =>
  new Date(anyDateInMonth).toLocaleDateString('en-US', { month: 'long' });

// Left-pads a 1-2 digit number to 2 digits, e.g. 3 -> "03". Used when
// building "YYYY-MM-DD" strings by hand.
export const pad2 = (value: number): string => String(value).padStart(2, '0');

// -----------------------------------------------------------------------
// Week-chip helpers — power the "W1 Jan 1-7, W2 Jan 8-14, ..." strip on
// the Employee Detail screen. Kept here rather than a separate file since
// they're just more date-range math, same as everything above.
// -----------------------------------------------------------------------
export interface WeekChip {
  label: string; // "W1"
  rangeLabel: string; // "Jan 1-7"
  fromDate: string; // "2024-01-01"
  toDate: string; // "2024-01-07"
}

// Splits the given month into consecutive 7-day chunks (last chunk may be
// shorter), e.g. Jan 2024 -> W1 1-7, W2 8-14, W3 15-21, W4 22-28, W5 29-31.
export const buildWeekChips = (year: number, month: number): WeekChip[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthShort = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  const chips: WeekChip[] = [];

  for (let startDay = 1, weekIndex = 1; startDay <= daysInMonth; startDay += 7, weekIndex += 1) {
    const endDay = Math.min(startDay + 6, daysInMonth);
    chips.push({
      label: `W${weekIndex}`,
      rangeLabel: `${monthShort} ${startDay}-${endDay}`,
      fromDate: `${year}-${pad2(month)}-${pad2(startDay)}`,
      toDate: `${year}-${pad2(month)}-${pad2(endDay)}`,
    });
  }

  return chips;
};

// Index of the chip containing today's date, or 0 if today isn't in this
// set of chips (i.e. the visible month isn't the current month).
export const getCurrentWeekIndex = (chips: WeekChip[]): number => {
  const todayStr = toDateString(new Date());
  const idx = chips.findIndex((chip) => todayStr >= chip.fromDate && todayStr <= chip.toDate);
  return idx === -1 ? 0 : idx;
};