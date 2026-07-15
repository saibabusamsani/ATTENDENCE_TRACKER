import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { AttendanceSummary } from '../../api/types/Attendance.types';

interface Props {
  summary: AttendanceSummary | null;
  isLoading: boolean;
  error: string | null;
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

export const DashboardAnalyticsCard: React.FC<Props> = ({ summary, isLoading, error }) => {
  if (isLoading && !summary) {
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

  if (!summary) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <StatItem label="Present" value={summary.presentCount} color={COLORS.success} />
        <StatItem label="Absent" value={summary.absentCount} color={COLORS.danger} />
        <StatItem label="Late" value={summary.lateCount} />
        <StatItem label="Early Out" value={summary.earlyLogoutCount} />
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <StatItem label="Total Punches" value={summary.totalPunches} />
        <StatItem label="Avg Delay (min)" value={summary.avgDelayMinutes} />
        <StatItem
          label="Devices Synced"
          value={summary.allDevicesSynced ? 'Yes' : 'No'}
          color={summary.allDevicesSynced ? COLORS.success : COLORS.danger}
        />
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  errorText: { fontSize: 12, color: COLORS.danger },
});