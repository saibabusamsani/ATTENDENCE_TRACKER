import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { WeekSummary, MonthSummary } from '../../utils/AggregateAnalytics';

interface Props {
  data: WeekSummary | MonthSummary | null;
  isLoading: boolean;
  error: string | null;
  emptyLabel?: string;
}

const StatItem: React.FC<{ label: string; value: number | string; color?: string }> = ({
  label,
  value,
  color = COLORS.textPrimary,
}) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const isMonthSummary = (d: WeekSummary | MonthSummary): d is MonthSummary =>
  'attendancePercentage' in d;

export const PeriodSummaryCard: React.FC<Props> = ({ data, isLoading, error, emptyLabel }) => {
  if (isLoading && !data) {
    return (
      <View style={[styles.card, styles.centered]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.card, styles.centered]}>
        <Text style={styles.emptyText}>{emptyLabel ?? 'No records for this period'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.rangeLabel}>
        {data.fromDate} – {data.toDate}
      </Text>
      <View style={styles.row}>
        <StatItem label="Present" value={data.presentDays} color={COLORS.success} />
        <StatItem label="Absent" value={data.absentDays} color={COLORS.danger} />
        <StatItem label="Late" value={data.lateDays} />
        <StatItem label="On Leave" value={data.onLeaveDays} />
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <StatItem label="Total Hours" value={data.totalWorkingHours} />
        <StatItem label="Avg / Day" value={data.avgDailyWorkHours} />
        {isMonthSummary(data) && (
          <StatItem label="Attendance %" value={`${data.attendancePercentage}%`} color={COLORS.success} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  centered: { alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  rangeLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 10, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  errorText: { fontSize: 12, color: COLORS.danger },
  emptyText: { fontSize: 12, color: COLORS.textMuted },
});