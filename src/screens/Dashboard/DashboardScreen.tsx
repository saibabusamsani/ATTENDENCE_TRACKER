// DashboardScreen.tsx - UPDATED
import React, { useMemo, useCallback, useLayoutEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, ActivityIndicator, ListRenderItem,
} from 'react-native';
import { TotalTimeCardRecord } from '../../api/types/Attendance.types';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatsGrid } from '../../components/dashboard/StatsGrid';
import { EmployeeRow } from '../../components/dashboard/EmployeeRow';
import { COLORS } from '../../constants/Colors';
import { useAttendance } from '../../hooks/UseAttendance';
import { useNavigation } from '@react-navigation/native';
import {formatDateTimeToTime, toDateString } from '../../utils/DateUtils';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));

  const {
    records: totalTimeCardList,
    isLoading,
    isRefreshing,
    searchInput,
    setSearchInput,
    handleRefresh,
    handleLoadMore,
    summary: attendanceSummary,
    error,
  } = useAttendance({ 
    scope: 'dashboard', 
    fromDate: selectedDate, 
    toDate: selectedDate,   
  });

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    [],
  );

  const lastUpdated = useMemo(()=>formatDateTimeToTime(attendanceSummary?.lastFetchedTime),[attendanceSummary])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <DashboardHeader
          dateLabel={todayLabel}
          lastUpdated={lastUpdated}
          userInitials="VK"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ),
    });
  }, [navigation, todayLabel, searchInput, selectedDate,lastUpdated]);

  const renderListHeader = useMemo(() => (
    <View style={styles.whiteBodyContainer}>
      <StatsGrid summary={attendanceSummary} />
      <View style={styles.activityHeadingRow}>
        <Text style={styles.activityTitle}>ACTIVITY</Text>
      </View>
    </View>
  ), [attendanceSummary, isLoading, error]);

  const handleRowPress = useCallback((item: TotalTimeCardRecord) => {
    navigation.navigate('EmployeeDetail', {
      personCode: item.personCode,
      fullName: item.fullName,
      groupName: item.groupName,
    });
  }, [navigation]);

  const renderEmployeeRow: ListRenderItem<TotalTimeCardRecord> = useCallback(
    ({ item }) => <EmployeeRow item={item} onPress={handleRowPress} />,
    [handleRowPress],
  );

  const renderFooterLoader = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [isLoading]);

  const keyExtractor = useCallback(
    (item: TotalTimeCardRecord) => `${item.personCode}-${item.date}`,
    [],
  );

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={totalTimeCardList}
        renderItem={renderEmployeeRow}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooterLoader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.15}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollListPadding}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollListPadding: {
    paddingBottom: 24,
  },
  whiteBodyContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  activityHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});