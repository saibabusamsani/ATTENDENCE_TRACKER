import React, { useMemo, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { TotalTimeCardRecord, ATTENDANCE_STATUS_MAP } from '../../api/types/Attendance.types';
import { EmployeeHeader } from '../../components/employee/EmployeeHeader';
import { COLORS } from '../../constants/Colors';
import { useAttendance } from '../../hooks/UseAttendance';
import { useEmployeeAnalytics } from '../../hooks/UseEmployeeAnalytics';
import { RootStackParamList } from '../../navigations/types';
import { DashboardAnalyticsCard } from '../../components/dashboard/DashboardAnalyticsCard';
import { toDateString } from '../../utils/DateUtils';
import { PeriodSummaryCard } from '../../components/employee/Periodsummarycard';

type EmployeeDetailRouteProp = RouteProp<RootStackParamList, 'EmployeeDetail'>;
type Tab = 'day' | 'week' | 'month';

const EmployeeDetailScreen: React.FC = () => {
  const route = useRoute<EmployeeDetailRouteProp>();
  const navigation = useNavigation();
  const { personCode, fullName, groupName } = route.params;

  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [activeTab, setActiveTab] = useState<Tab>('day');

  const day = useAttendance({ scope: 'employee', personCode, fromDate: selectedDate, toDate: selectedDate });
  const week = useEmployeeAnalytics(personCode, 'week', selectedDate);
  const month = useEmployeeAnalytics(personCode, 'month', selectedDate);

  const renderTabBar = useCallback(
    () => (
      <View style={styles.tabBar}>
        {(['day', 'week', 'month'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'day' ? 'Day' : tab === 'week' ? 'Week' : 'Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [activeTab],
  );

  const renderAnalyticsForTab = useCallback(() => {
    if (activeTab === 'day') {
      return (
        <DashboardAnalyticsCard
          summary={day.summary}
          isLoading={day.isLoading && day.records.length === 0}
          error={null}
        />
      );
    }
    const active = activeTab === 'week' ? week : month;
    return (
      <PeriodSummaryCard
        data={active.summary}
        isLoading={active.isLoading}
        error={active.error}
        emptyLabel={`No records for this ${activeTab}`}
      />
    );
  }, [activeTab, day, week, month]);

  const renderListHeader = useMemo(
    () => (
      <View>
        <EmployeeHeader
          personCode={personCode}
          fullName={fullName}
          groupName={groupName}
          shiftLabel="Shift 10 AM – 7 PM"
          selectedDate={selectedDate}
          onBack={() => navigation.goBack()}
          onSelectDate={setSelectedDate}
        />
        {renderTabBar()}
        {renderAnalyticsForTab()}
      </View>
    ),
    [personCode, fullName, groupName, selectedDate, navigation, renderTabBar, renderAnalyticsForTab],
  );

  const renderPunchRow: ListRenderItem<TotalTimeCardRecord> = useCallback(({ item }) => {
    const statusLabel = ATTENDANCE_STATUS_MAP[item.attendanceStatus] ?? 'Unknown';
    return (
      <View style={styles.punchCard}>
        <View style={styles.punchRowHeader}>
          <Text style={styles.punchDate}>{item.date}</Text>
          <Text style={styles.punchStatus}>{statusLabel}</Text>
        </View>
        <View style={styles.punchTimeRow}>
          <View style={styles.punchTimeCol}>
            <Text style={styles.punchTimeLabel}>Check-in</Text>
            <Text style={styles.punchTimeValue}>{item.clockInTime || '--:--'}</Text>
          </View>
          <View style={styles.punchTimeCol}>
            <Text style={styles.punchTimeLabel}>Check-out</Text>
            <Text style={styles.punchTimeValue}>{item.clockOutTime || '--:--'}</Text>
          </View>
          <View style={styles.punchTimeCol}>
            <Text style={styles.punchTimeLabel}>Worked</Text>
            <Text style={styles.punchTimeValue}>{item.workDuration || '00:00'}</Text>
          </View>
        </View>
      </View>
    );
  }, []);

  const renderFooter = useCallback(() => {
    if (activeTab !== 'day' || !day.isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [activeTab, day.isLoading]);

  const renderEmpty = useCallback(() => {
    if (day.isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No punch records found</Text>
      </View>
    );
  }, [day.isLoading]);

  const listData = activeTab === 'day' ? day.records : [];

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={listData}
        renderItem={renderPunchRow}
        keyExtractor={(item) => `${item.personCode}-${item.date}`}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={activeTab === 'day' ? renderEmpty : null}
        onEndReached={activeTab === 'day' ? day.handleLoadMore : undefined}
        onEndReachedThreshold={0.15}
        refreshing={activeTab === 'day' ? day.isRefreshing : false}
        onRefresh={activeTab === 'day' ? day.handleRefresh : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollListPadding}
      />
    </View>
  );
};

export default EmployeeDetailScreen;

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  scrollListPadding: { paddingBottom: 24 },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 4,
  },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabButtonActive: { backgroundColor: COLORS.primary },
  tabLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.textInverse },
  punchCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  punchRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  punchDate: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  punchStatus: { fontSize: 12, fontWeight: '600', color: COLORS.success },
  punchTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  punchTimeCol: { alignItems: 'flex-start' },
  punchTimeLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 3 },
  punchTimeValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textMuted },
});