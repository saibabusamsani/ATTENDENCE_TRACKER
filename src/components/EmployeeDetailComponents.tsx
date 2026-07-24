import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/Colors';
import { TotalTimeCardRecord, ATTENDANCE_STATUS_MAP } from '../api/types/Attendance.types';
import { WeekChip, pad2, toDateString } from '../utils/DateUtils';

// -----------------------------------------------------------------------
// 1. PeriodTabBar — the "Weekly / Monthly" gradient switch
// -----------------------------------------------------------------------
export type PeriodTab = 'week' | 'month';

interface PeriodTabBarProps {
  activeTab: PeriodTab;
  onChange: (tab: PeriodTab) => void;
}

const TAB_OPTIONS: { key: PeriodTab; label: string }[] = [
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
];

export const PeriodTabBar: React.FC<PeriodTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <View style={styles.tabBar}>
      {TAB_OPTIONS.map(({ key, label }) => {
        const active = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            activeOpacity={0.8}
            style={styles.tabButtonWrapper}
          >
            {active ? (
              <LinearGradient
                colors={[...COLORS.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabButton}
              >
                <Text style={styles.tabLabelActive}>{label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabButton}>
                <Text style={styles.tabLabel}>{label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// -----------------------------------------------------------------------
// 2. WeekChipStrip — scrollable "W1 Jan 1-7" chips, auto-scrolls to the
//    selected chip whenever it changes.
// -----------------------------------------------------------------------
interface WeekChipStripProps {
  chips: WeekChip[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const WeekChipStrip: React.FC<WeekChipStripProps> = ({ chips, selectedIndex, onSelect }) => {
  const listRef = useRef<FlatList<WeekChip>>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5,
      });
    });
  }, [selectedIndex, chips]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={chips}
      keyExtractor={(chip) => chip.label}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.weekChipList}
      onScrollToIndexFailed={({ index }) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 100);
      }}
      renderItem={({ item, index }) => {
        const active = index === selectedIndex;
        const isFuture = item.fromDate > toDateString(new Date());

        if (isFuture) {
          return (
            <View style={[styles.weekChip, styles.weekChipInactive, styles.weekChipDisabled]}>
              <Text style={[styles.weekChipLabel, styles.weekChipLabelDisabled]}>{item.label}</Text>
              <Text style={[styles.weekChipRange, styles.weekChipLabelDisabled]}>{item.rangeLabel}</Text>
            </View>
          );
        }

        return (
          <TouchableOpacity onPress={() => onSelect(index)} activeOpacity={0.8}>
            {active ? (
              <LinearGradient
                colors={[...COLORS.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.weekChip}
              >
                <Text style={styles.weekChipLabelActive}>{item.label}</Text>
                <Text style={styles.weekChipRangeActive}>{item.rangeLabel}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.weekChip, styles.weekChipInactive]}>
                <Text style={styles.weekChipLabel}>{item.label}</Text>
                <Text style={styles.weekChipRange}>{item.rangeLabel}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
};

// -----------------------------------------------------------------------
// 3. MonthNavBar — year and month arrow navigation
// -----------------------------------------------------------------------
interface MonthNavBarProps {
  year: number;
  month: number; // 1-12
  onChangeYear: (delta: number) => void;
  onChangeMonth: (delta: number) => void;
  disableYearNext?: boolean;
  disableMonthNext?: boolean;
}

interface NavArrowProps {
  symbol: '‹' | '›';
  onPress: () => void;
  disabled?: boolean;
}

const NavArrow: React.FC<NavArrowProps> = ({ symbol, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.navArrow, disabled && styles.navArrowDisabled]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Text style={[styles.navArrowText, disabled && styles.navArrowTextDisabled]}>{symbol}</Text>
    </TouchableOpacity>
  );
};

export const MonthNavBar: React.FC<MonthNavBarProps> = ({
  year,
  month,
  onChangeYear,
  onChangeMonth,
  disableYearNext,
  disableMonthNext,
}) => {
  return (
    <View style={styles.navBar}>
      <View style={styles.navGroup}>
        <NavArrow symbol="‹" onPress={() => onChangeYear(-1)} />
        <Text style={styles.navValue}>{year}</Text>
        <NavArrow symbol="›" onPress={() => onChangeYear(1)} disabled={disableYearNext} />
      </View>

      <View style={styles.navDivider} />

      <View style={styles.navGroup}>
        <NavArrow symbol="‹" onPress={() => onChangeMonth(-1)} />
        <Text style={styles.navValue}>{`${year}-${pad2(month)}`}</Text>
        <NavArrow symbol="›" onPress={() => onChangeMonth(1)} disabled={disableMonthNext} />
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------
// 4. DailyRecordCard — a single punch-in/out row
// -----------------------------------------------------------------------
interface DailyRecordCardProps {
  record: TotalTimeCardRecord;
}

export const DailyRecordCard: React.FC<DailyRecordCardProps> = ({ record }) => {
  const statusLabel = ATTENDANCE_STATUS_MAP[record.attendanceStatus] ?? 'Unknown';

  return (
    <View style={styles.punchCard}>
      <View style={styles.punchHeaderRow}>
        <Text style={styles.punchDate}>{record.date}</Text>
        <Text style={styles.punchStatus}>{statusLabel}</Text>
      </View>

      <View style={styles.punchTimeRow}>
        <View style={styles.punchTimeCol}>
          <Text style={styles.punchTimeLabel}>Check-in</Text>
          <Text style={styles.punchTimeValue}>{record.clockInTime || '--:--'}</Text>
        </View>

        <View style={styles.punchTimeCol}>
          <Text style={styles.punchTimeLabel}>Check-out</Text>
          <Text style={styles.punchTimeValue}>{record.clockOutTime || '--:--'}</Text>
        </View>

        <View style={styles.punchTimeCol}>
          <Text style={styles.punchTimeLabel}>Worked</Text>
          <Text style={styles.punchTimeValue}>{record.workDuration || '00:00'}</Text>
        </View>
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------
// Styles — shared across all four components above
// -----------------------------------------------------------------------
const styles = StyleSheet.create({
  // PeriodTabBar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  tabButtonWrapper: {
    flex: 1,
    borderRadius: 9,
    overflow: 'hidden',
  },
  tabButton: {
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textInverse,
  },

  // WeekChipStrip
  weekChipList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  weekChip: {
    width: 88,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  weekChipInactive: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  weekChipDisabled: {
    opacity: 0.4,
  },
  weekChipLabelDisabled: {
    color: COLORS.textMuted,
  },
  weekChipLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  weekChipLabelActive: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
  weekChipRange: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  weekChipRangeActive: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textInverse,
    marginTop: 2,
  },

  // MonthNavBar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  navArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    opacity: 0.35,
  },
  navArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  navArrowTextDisabled: {
    color: COLORS.textMuted,
  },
  navValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },

  // DailyRecordCard
  punchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  punchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  punchDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  punchStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  punchTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  punchTimeCol: {
    alignItems: 'flex-start',
  },
  punchTimeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  punchTimeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});