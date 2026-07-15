import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, getAvatarColor } from '../../constants/Colors';
import { CalendarStrip } from '../shared/CalendarStrip';

interface Props {
  personCode: string;
  fullName: string;
  groupName: string;
  shiftLabel: string;
  selectedDate: string;
  onBack: () => void;
  onSelectDate: (fullDate: string) => void;
}

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

export const EmployeeHeader: React.FC<Props> = ({
  personCode,
  fullName,
  groupName,
  shiftLabel,
  selectedDate,
  onBack,
  onSelectDate,
}) => (
  <View style={styles.wrapper}>
    <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
      <Text style={styles.backIcon}>‹</Text>
    </TouchableOpacity>

    <View style={styles.profileRow}>
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(personCode) }]}>
        <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
      </View>
      <View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.meta}>{personCode} · {groupName} · {shiftLabel}</Text>
      </View>
    </View>

    <CalendarStrip selectedDate={selectedDate} onSelectDate={onSelectDate} />
  </View>
);

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, backgroundColor: COLORS.primaryDark },
  backButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.overlayLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  backIcon: { color: COLORS.textInverse, fontSize: 18, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: COLORS.textInverse, fontWeight: '700', fontSize: 14 },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.textInverse },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});