import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../constants/Colors';
import { CalendarStrip } from '../shared/CalendarStrip';
import { SearchBar } from '../shared/SearchBar';

interface Props {
  dateLabel: string;
  lastUpdated: string;
  userInitials: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
  selectedDate: string;
  onSelectDate: (fullDate: string) => void;
}

export const DashboardHeader: React.FC<Props> = ({ dateLabel, lastUpdated, userInitials, searchValue, onSearchChange, selectedDate, onSelectDate,}) => (
  <View style={styles.wrapper}>
    <View style={styles.topRow}>
      <View>
        <Text style={styles.title}>Shift Overview</Text>
        <Text style={styles.subtitle}>{dateLabel}</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userInitials}</Text>
      </View>
    </View>

    <View style={styles.syncPill}>
      <View style={styles.pulseDot} />
      <Text style={styles.syncText}>
        Last updated <Text style={styles.syncTextBold}>{lastUpdated}</Text> 
      </Text>
    </View>

    <SearchBar value={searchValue} onChangeText={onSearchChange} />
    <CalendarStrip selectedDate={selectedDate} onSelectDate={onSelectDate} />
  </View>
);

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, backgroundColor: COLORS.primaryDark },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textInverse },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.textInverse, fontWeight: 'bold', fontSize: 13 },
  syncPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.overlayLight, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 6 },
  syncText: { fontSize: 10.5, color: COLORS.textInverse },
  syncTextBold: { fontWeight: '700' },
});