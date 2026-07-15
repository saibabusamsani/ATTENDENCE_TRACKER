import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { TotalTimeCardRecord } from '../../api/types/Attendance.types';
import { COLORS, getAvatarColor } from '../../constants/Colors';
import { formatTime } from '../../utils/DateUtils';

const { height } = Dimensions.get('window');

interface EmployeeRowProps {
  item: TotalTimeCardRecord;
  onPress: (item: TotalTimeCardRecord) => void;
}

const getInitials = (fullName: string): string =>
  fullName
    ? fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'EE';

function EmployeeRowComponent({ item, onPress }: EmployeeRowProps) {
  const initials = getInitials(item.fullName);
  return (
    <TouchableOpacity
      style={styles.employeeCard}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(item.personCode) }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.employeeDetails}>
        <Text style={styles.employeeName} numberOfLines={1}>
          {item.fullName}
        </Text>
        <Text style={styles.employeeMeta} numberOfLines={1}>
          {item.groupName} · {item.personCode}
        </Text>
        <Text style={styles.clockInText} numberOfLines={1}>
          In: {item.clockInTime || '--:--'}
        </Text>
      </View>

      <View style={styles.timeStatusColumn}>
        <View style={styles.checkoutBadge}>
          <Text style={styles.checkoutBadgeText}>Check-out</Text>
        </View>
        <Text style={styles.timeValueText}>{item.clockOutTime || '--:--' }</Text>
      </View>
    </TouchableOpacity>
  );
}

const areEqual = (prev: EmployeeRowProps, next: EmployeeRowProps): boolean =>
  prev.item.personCode === next.item.personCode &&
  prev.item.fullName === next.item.fullName &&
  prev.item.groupName === next.item.groupName &&
  prev.item.clockInTime === next.item.clockInTime &&
  prev.item.clockOutTime === next.item.clockOutTime;

export const EmployeeRow = React.memo(EmployeeRowComponent, areEqual);

const styles = StyleSheet.create({
  employeeCard: {
    flexDirection: 'row',
    height: height * 0.1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  employeeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  employeeMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  clockInText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  timeStatusColumn: {
    alignItems: 'flex-end',
  },
  checkoutBadge: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  checkoutBadgeText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '600',
  },
  timeValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});