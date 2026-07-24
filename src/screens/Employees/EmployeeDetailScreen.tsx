import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, ListRenderItem } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { TotalTimeCardRecord } from '../../api/types/Attendance.types';
import { EmployeeHeader } from '../../components/employee/EmployeeHeader';
import { StatsGrid } from '../../components/dashboard/StatsGrid';
import {
  PeriodTab,
  DailyRecordCard,
} from '../../components/EmployeeDetailComponents';
import { COLORS } from '../../constants/Colors';
import { useAttendance } from '../../hooks/UseAttendance';
import { RootStackParamList } from '../../navigations/types';
import {
  getMonthName,
  pad2,
  buildWeekChips,
  getCurrentWeekIndex,
} from '../../utils/DateUtils';
import { animateLayout } from '../../utils/AnimationUtils';

type EmployeeDetailRouteProp = RouteProp<RootStackParamList, 'EmployeeDetail'>;

const EmployeeDetailScreen: React.FC = () => {
  const route = useRoute<EmployeeDetailRouteProp>();
  const navigation = useNavigation();
  const { personCode, fullName, groupName } = route.params;

  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<PeriodTab>('week');
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const weekChips = useMemo(() => buildWeekChips(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const activeWeek = weekChips[Math.min(selectedWeekIndex, weekChips.length - 1)];

  // Whenever the visible month/year changes, snap the pick to today's week
  // if it's in that month, otherwise the first week.
  useEffect(() => {
    setSelectedWeekIndex(getCurrentWeekIndex(weekChips));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  const { records, isLoading, isRefreshing, error, handleLoadMore, handleRefresh, summary } = useAttendance(
    activeTab === 'week'
      ? { scope: 'employee', personCode, fromDate: activeWeek.fromDate, toDate: activeWeek.toDate }
      : { scope: 'employee', personCode, month: `${selectedYear}-${pad2(selectedMonth)}` },
  );

  const switchTab = useCallback((tab: PeriodTab) => {
    animateLayout();
    setActiveTab(tab);
  }, []);

  const selectWeek = useCallback((index: number) => {
    animateLayout();
    setSelectedWeekIndex(index);
  }, []);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const changeMonth = useCallback((delta: number) => {
    setSelectedMonth((prevMonth) => {
      let month = prevMonth + delta;
      let year = selectedYear;

      if (month < 1) {
        month = 12;
        year -= 1;
      }

      if (month > 12) {
        month = 1;
        year += 1;
      }

      // Never navigate past the current year-month.
      const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
      if (isFuture) return prevMonth;

      animateLayout();
      setSelectedYear(year);
      return month;
    });
  }, [selectedYear, currentYear, currentMonth]);

  const changeYear = useCallback((delta: number) => {
    setSelectedYear((prevYear) => {
      const year = prevYear + delta;
      if (year > currentYear) return prevYear; // never navigate past the current year
      animateLayout();
      return year;
    });
  }, [currentYear]);

  // Disable the "next" arrows once already at the current year/month —
  // there's nothing forward of today to navigate to.
  const disableYearNext = selectedYear >= currentYear;
  const disableMonthNext = selectedYear === currentYear && selectedMonth >= currentMonth;

  const periodTitle = activeTab === 'week'
    ? `${activeWeek.label} Overview`
    : `${getMonthName(`${selectedYear}-${pad2(selectedMonth)}-01`)} Overview`;

  // EmployeeHeader now owns identity + tab switcher + week/month nav as
  // one unit — this just passes state through and mounts it as the
  // actual navigation header, not inside the scrolling list.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <EmployeeHeader
          personCode={personCode}
          fullName={fullName}
          groupName={groupName}
          onBack={() => navigation.goBack()}
          activeTab={activeTab}
          onChangeTab={switchTab}
          weekChips={weekChips}
          selectedWeekIndex={selectedWeekIndex}
          onSelectWeek={selectWeek}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onChangeYear={changeYear}
          onChangeMonth={changeMonth}
          disableYearNext={disableYearNext}
          disableMonthNext={disableMonthNext}
        />
      ),
    });
  }, [navigation, personCode, fullName, groupName, activeTab, weekChips, selectedWeekIndex, selectedYear, selectedMonth, switchTab, selectWeek, changeYear, changeMonth, disableYearNext, disableMonthNext]);

  const renderListHeader = () => (
    <View>
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>{periodTitle.toUpperCase()}</Text>

        {isLoading && !summary && (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.summaryLoader} />
        )}

        {!isLoading && error && (
          <Text style={styles.summaryError}>{error}</Text>
        )}

        {!isLoading && !error && !summary && (
          <Text style={styles.summaryEmpty}>{`No records for this ${activeTab}`}</Text>
        )}

        {summary && <StatsGrid summary={summary} />}

        {activeTab === 'week' ? (
          <Text style={styles.periodRangeText}>
            Period: <Text style={styles.periodRangeBold}>{activeWeek.fromDate}</Text> to <Text style={styles.periodRangeBold}>{activeWeek.toDate}</Text>
          </Text>
        ) : (
          <Text style={styles.periodRangeText}>
            Period: <Text style={styles.periodRangeBold}>{`${selectedYear}-${pad2(selectedMonth)}`}</Text>
          </Text>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderText}>DAILY RECORDS</Text>
      </View>
    </View>
  );

  const renderPunchRow: ListRenderItem<TotalTimeCardRecord> = useCallback(
    ({ item }) => <DailyRecordCard record={item} />,
    [],
  );

  const renderFooter = () => {
    if (!isLoading || records.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No punch records found</Text>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={records}
        renderItem={renderPunchRow}
        keyExtractor={(item) => `${item.personCode}-${item.date}`}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.15}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollListPadding}
      />
    </View>
  );
};

export default EmployeeDetailScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollListPadding: {
    paddingBottom: 24,
  },
  summarySection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  summaryLoader: {
    marginVertical: 16,
  },
  summaryError: {
    fontSize: 12,
    color: COLORS.danger,
  },
  summaryEmpty: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  periodRangeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  periodRangeBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHeaderRow: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});