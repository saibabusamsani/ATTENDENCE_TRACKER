import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AttendanceSummary } from '../../api/types/Attendance.types';

interface StatsGridProps {
  summary: AttendanceSummary | null;
}

export function StatsGrid({ summary }: StatsGridProps) {
  if (!summary) return null;

  const {
    presentCount,
    absentCount,
    lateCount,
    avgDelayMinutes,
    earlyLogoutCount,
    totalPunches,
    allDevicesSynced,
    totalCount,
  } = summary;

  return (
    <View style={styles.statsGridContainer}>
      <View style={styles.metricItemBox}>
        <Text style={styles.metricBigText}>
          {presentCount}
          <Text style={styles.metricSmallText}>/{totalCount}</Text>
        </Text>
        <View style={styles.labelIndicatorRow}>
          <View style={[styles.miniIndicatorDot, { backgroundColor: '#2EC4B6' }]} />
          <Text style={styles.metricLabelText}>Present</Text>
        </View>
        <View style={[styles.metricAlertBadge, { backgroundColor: '#E6F9F6' }]}>
          <Text style={[styles.alertBadgeText, { color: '#2EC4B6' }]}>
            {absentCount} absent
          </Text>
        </View>
      </View>

      <View style={styles.metricItemBox}>
        <Text style={styles.metricBigText}>{lateCount}</Text>
        <View style={styles.labelIndicatorRow}>
          <View style={[styles.miniIndicatorDot, { backgroundColor: '#FF9F1C' }]} />
          <Text style={styles.metricLabelText}>Late (after 10:00)</Text>
        </View>
        <View style={[styles.metricAlertBadge, { backgroundColor: '#FFF5E6' }]}>
          <Text style={[styles.alertBadgeText, { color: '#FF9F1C' }]}>
            Avg delay {avgDelayMinutes} min
          </Text>
        </View>
      </View>

      <View style={styles.metricItemBox}>
        <Text style={styles.metricBigText}>{earlyLogoutCount}</Text>
        <View style={styles.labelIndicatorRow}>
          <View style={[styles.miniIndicatorDot, { backgroundColor: '#E71D36' }]} />
          <Text style={styles.metricLabelText}>Early logout</Text>
        </View>
        <View style={[styles.metricAlertBadge, { backgroundColor: '#FFEBEB' }]}>
          <Text style={[styles.alertBadgeText, { color: '#E71D36' }]}>
            {earlyLogoutCount > 0 ? 'Needs review' : 'All clear'}
          </Text>
        </View>
      </View>

      <View style={styles.metricItemBox}>
        <Text style={styles.metricBigText}>{totalPunches}</Text>
        <View style={styles.labelIndicatorRow}>
          <View style={[styles.miniIndicatorDot, { backgroundColor: '#3B66D6' }]} />
          <Text style={styles.metricLabelText}>Total punches</Text>
        </View>
        <View style={[styles.metricAlertBadge, { backgroundColor: '#EEF2FC' }]}>
          <Text style={[styles.alertBadgeText, { color: '#3B66D6' }]}>
            {allDevicesSynced ? 'Devices synced' : 'Sync issue'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItemBox: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBF0FA',
  },
  metricBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111E38',
  },
  metricSmallText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '400',
  },
  labelIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 8,
  },
  miniIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  metricLabelText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
  metricAlertBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  alertBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});