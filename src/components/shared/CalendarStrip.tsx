import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, FlatList,
  Modal, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

export interface CalendarDay {
  date: string;      // "09"
  day: string;        // "Thu"
  fullDate: string;   // "2026-07-09"
}

const DAY_WIDTH = 46;
const DAY_GAP = 8;
const ITEM_SPAN = DAY_WIDTH + DAY_GAP;
const CHUNK_SIZE = 30;
const MAX_DAYS = 180; // caps the strip so scroll-driven prepends can't grow it unbounded
const START_THRESHOLD_PX = 120; // how close to the left edge before loading more

const toDateString = (d: Date): string => d.toISOString().slice(0, 10);

// Builds `count` consecutive days ending at endDate (inclusive), oldest -> newest
const buildDateRange = (endDate: Date, count: number): CalendarDay[] => {
  const days: CalendarDay[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    days.push({
      date: String(d.getDate()).padStart(2, '0'),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: toDateString(d),
    });
  }
  return days;
};

interface Props {
  selectedDate: string;
  onSelectDate: (fullDate: string) => void;
}

export const CalendarStrip: React.FC<Props> = ({ selectedDate, onSelectDate }) => {
  const listRef = useRef<FlatList<CalendarDay>>(null);
  const [days, setDays] = useState<CalendarDay[]>(() => buildDateRange(new Date(), CHUNK_SIZE));
  const [pickerVisible, setPickerVisible] = useState(false);
  const loadingMoreRef = useRef(false);
  const hasScrolledToEndRef = useRef(false);

  const prependOlderDays = useCallback(() => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    setDays((prev) => {
      const oldest = new Date(prev[0].fullDate);
      oldest.setDate(oldest.getDate() - 1);
      const older = buildDateRange(oldest, CHUNK_SIZE);
      const merged = [...older, ...prev];
      return merged.length > MAX_DAYS ? merged.slice(0, MAX_DAYS) : merged;
    });

    // Preserve the user's visual scroll position after items are prepended,
    // since inserting at index 0 would otherwise jump the list.
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: CHUNK_SIZE * ITEM_SPAN,
        animated: false,
      });
      loadingMoreRef.current = false;
    });
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.x <= START_THRESHOLD_PX) {
      prependOlderDays();
    }
  }, [prependOlderDays]);

  const handlePickDate = useCallback((fullDate: string) => {
    setPickerVisible(false);
    onSelectDate(fullDate);

    setDays((prev) => {
      const inRange = prev.some((d) => d.fullDate === fullDate);
      if (inRange) return prev;
      return buildDateRange(new Date(fullDate), CHUNK_SIZE);
    });

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [onSelectDate]);

  const renderItem = useCallback(({ item }: { item: CalendarDay }) => {
    const isSelected = item.fullDate === selectedDate;
    return (
      <TouchableOpacity
        style={[styles.calendarCard, isSelected && styles.calendarCardActive]}
        activeOpacity={0.7}
        onPress={() => onSelectDate(item.fullDate)}
      >
        <Text style={[styles.calDate, isSelected && styles.calActiveText]}>{item.date}</Text>
        <Text style={[styles.calDay, isSelected && styles.calActiveText]}>{item.day}</Text>
      </TouchableOpacity>
    );
  }, [selectedDate, onSelectDate]);

  const markedDates = useMemo(() => ({
    [selectedDate]: { selected: true, selectedColor: '#3B66D6' },
  }), [selectedDate]);

  return (
    <View style={styles.stripRow}>
      <FlatList
        ref={listRef}
        data={days}
        horizontal
        keyExtractor={(item) => item.fullDate}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: DAY_GAP }} />}
        getItemLayout={(_, index) => ({ length: ITEM_SPAN, offset: ITEM_SPAN * index, index })}
        onLayout={() => {
          // Jump to "today" (the rightmost item) on first mount only.
          if (!hasScrolledToEndRef.current) {
            hasScrolledToEndRef.current = true;
            requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
          }
        }}
        removeClippedSubviews
        windowSize={5}
      />

      <TouchableOpacity
        style={styles.calendarIconButton}
        activeOpacity={0.7}
        onPress={() => setPickerVisible(true)}
      >
        <Text style={styles.calendarIconGlyph}>🗓</Text>
      </TouchableOpacity>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Calendar
              current={selectedDate}
              maxDate={toDateString(new Date())}
              markedDates={markedDates}
              onDayPress={(d: DateData) => handlePickDate(d.dateString)}
              theme={{
                todayTextColor: '#3B66D6',
                selectedDayBackgroundColor: '#3B66D6',
                arrowColor: '#3B66D6',
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  stripRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  listContent: { paddingRight: 4 },
  calendarCard: {
    width: DAY_WIDTH, height: 50, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center',
  },
  calendarCardActive: { backgroundColor: '#3B66D6' },
  calDate: { fontSize: 15, fontWeight: '700', color: '#A0AEC0' },
  calDay: { fontSize: 10, color: '#718096' },
  calActiveText: { color: '#FFFFFF', fontWeight: '700' },
  calendarIconButton: {
    width: 40, height: 40, borderRadius: 10, marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  calendarIconGlyph: { fontSize: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
});