import { TotalTimeCardRecord } from '../api/types/Attendance.types';
import { daysBetweenInclusive, getMonthName, getYear } from './DateUtils';

const parseHHMM = (v: string): number => {
  if (!v) return 0;
  const [h, m] = v.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
};

export interface WeekSummary {
  fromDate: string;
  toDate: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  onLeaveDays: number;
  totalWorkingMinutes: number;
  totalWorkingHours: string;
  avgDailyWorkHours: string;
}

export interface MonthSummary extends WeekSummary {
  monthName: string;
  year: number;
  totalDays: number;
  attendancePercentage: number;
}

interface Tally {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  onLeaveDays: number;
  totalMinutes: number;
}

// attendanceStatus per ATTENDANCE_STATUS_MAP: 0 Normal, 1 Late, 2 Early Leave, 3/5 Absent, 4 Leave.
const tallyRecords = (records: TotalTimeCardRecord[]): Tally => {
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let onLeaveDays = 0;
  let totalMinutes = 0;

  for (const r of records) {
    if (r.attendanceStatus === 3 || r.attendanceStatus === 5) {
      absentDays++;
    } else if (r.attendanceStatus === 4) {
      onLeaveDays++;
    } else {
      presentDays++;
    }
    if (r.attendanceStatus === 1) lateDays++;
    totalMinutes += parseHHMM(r.workDuration);
  }

  return { presentDays, absentDays, lateDays, onLeaveDays, totalMinutes };
};

export const aggregateWeek = (
  records: TotalTimeCardRecord[],
  fromDate: string,
  toDate: string,
): WeekSummary => {
  const t = tallyRecords(records);
  const workedDays = t.presentDays || 1;
  return {
    fromDate,
    toDate,
    presentDays: t.presentDays,
    absentDays: t.absentDays,
    lateDays: t.lateDays,
    onLeaveDays: t.onLeaveDays,
    totalWorkingMinutes: t.totalMinutes,
    totalWorkingHours: formatMinutes(t.totalMinutes),
    avgDailyWorkHours: formatMinutes(t.totalMinutes / workedDays),
  };
};

export const aggregateMonth = (
  records: TotalTimeCardRecord[],
  fromDate: string,
  toDate: string,
): MonthSummary => {
  const week = aggregateWeek(records, fromDate, toDate);
  const totalDays = daysBetweenInclusive(fromDate, toDate);
  return {
    ...week,
    monthName: getMonthName(fromDate),
    year: getYear(fromDate),
    totalDays,
    attendancePercentage: totalDays > 0 ? Math.round((week.presentDays / totalDays) * 1000) / 10 : 0,
  };
};