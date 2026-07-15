import { useMemo } from 'react';
import { useAttendance } from './UseAttendance';
import { getWeekRange, getMonthRange } from '../utils/DateUtils';
import { aggregateWeek, aggregateMonth, WeekSummary, MonthSummary } from '../utils/AggregateAnalytics';

type Period = 'week' | 'month';

export const useEmployeeAnalytics = (personCode: string, period: Period, anyDateInPeriod: string) => {
  const { fromDate, toDate } = useMemo(
    () => (period === 'week' ? getWeekRange(anyDateInPeriod) : getMonthRange(anyDateInPeriod)),
    [period, anyDateInPeriod],
  );

  const { records, isLoading, error, handleRefresh } = useAttendance({
    scope: 'employee',
    personCode,
    fromDate,
    toDate,
  });

  const summary: WeekSummary | MonthSummary | null = useMemo(() => {
    if (!records.length) return null;
    return period === 'week'
      ? aggregateWeek(records, fromDate, toDate)
      : aggregateMonth(records, fromDate, toDate);
  }, [records, period, fromDate, toDate]);

  return { summary, isLoading, error, handleRefresh, fromDate, toDate };
};