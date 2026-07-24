import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { COLORS, getAvatarColor } from '../../constants/Colors';
import {
  PeriodTabBar,
  PeriodTab,
  WeekChipStrip,
  MonthNavBar,
} from '../EmployeeDetailComponents';
import { WeekChip } from '../../utils/DateUtils';

interface Props {
  personCode: string;
  fullName: string;
  groupName: string;
  onBack: () => void;

  activeTab: PeriodTab;
  onChangeTab: (tab: PeriodTab) => void;

  weekChips: WeekChip[];
  selectedWeekIndex: number;
  onSelectWeek: (index: number) => void;

  selectedYear: number;
  selectedMonth: number;
  onChangeYear: (delta: number) => void;
  onChangeMonth: (delta: number) => void;
  disableYearNext: boolean;
  disableMonthNext: boolean;
}

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

export const EmployeeHeader: React.FC<Props> = ({
  personCode,
  fullName,
  groupName,
  onBack,
  activeTab,
  onChangeTab,
  weekChips,
  selectedWeekIndex,
  onSelectWeek,
  selectedYear,
  selectedMonth,
  onChangeYear,
  onChangeMonth,
  disableYearNext,
  disableMonthNext,
}) => (
  <View>
    <View style={styles.wrapper}>
      <View style={styles.profileRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>

        <View style={[styles.avatar, { backgroundColor: getAvatarColor(personCode) }]}>
          <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.meta}>{personCode} · {groupName}</Text>
        </View>
      </View>
    </View>

    <PeriodTabBar activeTab={activeTab} onChange={onChangeTab} />

    {activeTab === 'week' ? (
      <WeekChipStrip chips={weekChips} selectedIndex={selectedWeekIndex} onSelect={onSelectWeek} />
    ) : (
      <MonthNavBar
        year={selectedYear}
        month={selectedMonth}
        onChangeYear={onChangeYear}
        onChangeMonth={onChangeMonth}
        disableYearNext={disableYearNext}
        disableMonthNext={disableMonthNext}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.primaryDark,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  nameBlock: {
    flexShrink: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});