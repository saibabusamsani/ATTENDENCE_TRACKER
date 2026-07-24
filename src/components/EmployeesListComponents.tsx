import React, { memo, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { Employee } from '../api/types/Employee.type';
import { COLORS, getAvatarColor } from '../constants/Colors';

const HEADER_HEIGHT = Platform.OS === 'ios' ? 56 : 60;
const ANIM_DURATION = 220;

interface EmployeesHeaderProps {
  title?: string;
  searchValue: string;
  onChangeSearch: (text: string) => void;
  totalCount?: number;
  placeholder?: string;
}

export const EmployeesHeader: React.FC<EmployeesHeaderProps> = memo(
  ({
    title = 'Employees',
    searchValue,
    onChangeSearch,
    totalCount = 0,
    placeholder = 'Search by name or ID...',
  }) => {
    const inputRef = useRef<TextInput>(null);
    const [isOpen, setIsOpen] = useState(false);

    const titleOpacity = useRef(new Animated.Value(1)).current;
    const titleTranslateY = useRef(new Animated.Value(0)).current;
    const searchOpacity = useRef(new Animated.Value(0)).current;
    const searchTranslateY = useRef(new Animated.Value(8)).current;

    const openSearch = useCallback(() => {
      setIsOpen(true);
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: -6, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(searchOpacity, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(searchTranslateY, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
      ]).start(() => inputRef.current?.focus());
    }, [titleOpacity, titleTranslateY, searchOpacity, searchTranslateY]);

    const closeSearch = useCallback(() => {
      inputRef.current?.blur();
      onChangeSearch('');
      Animated.parallel([
        Animated.timing(searchOpacity, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(searchTranslateY, { toValue: 8, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
      ]).start(() => setIsOpen(false));
    }, [onChangeSearch, titleOpacity, titleTranslateY, searchOpacity, searchTranslateY]);

    return (
      <View style={headerStyles.wrapper}>
        <View style={headerStyles.row}>
          {/* Title row */}
          <Animated.View
            pointerEvents={isOpen ? 'none' : 'auto'}
            style={[
              headerStyles.layer,
              { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
            ]}
          >
            <View style={headerStyles.titleBlock}>
              <Text style={headerStyles.title}>{title}</Text>
              <Text style={headerStyles.subtitle}>Total: {totalCount}</Text>
            </View>

            <TouchableOpacity
              onPress={openSearch}
              activeOpacity={0.7}
              style={headerStyles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="search" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Search row */}
          <Animated.View
            pointerEvents={isOpen ? 'auto' : 'none'}
            style={[
              headerStyles.layer,
              headerStyles.absoluteFill,
              { opacity: searchOpacity, transform: [{ translateY: searchTranslateY }] },
            ]}
          >
            <View style={headerStyles.searchPill}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} style={headerStyles.searchIcon} />
              <TextInput
                ref={inputRef}
                value={searchValue}
                onChangeText={onChangeSearch}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                style={headerStyles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchValue.length > 0 && (
                <TouchableOpacity
                  onPress={() => onChangeSearch('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={closeSearch}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={headerStyles.cancelBtn}
            >
              <Text style={headerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }
);

const headerStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  row: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
  },
  layer: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  titleBlock: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: "white",
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.infoBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 0,
  },
  cancelBtn: {
    marginLeft: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

/* ------------------------------------------------------------------ */
/* EmployeeCard                                                        */
/* ------------------------------------------------------------------ */

interface EmployeeCardProps {
  employee: Employee;
  onPress: (employee: Employee) => void;
}
export const EmployeeCard = memo(({ employee, onPress }: EmployeeCardProps) => {
  const avatarColor = getAvatarColor(employee.personCode || '');
  const initials =
    employee.fullName
      ?.split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={cardStyles.card}
      onPress={() => onPress(employee)}
    >
      <View style={[cardStyles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={cardStyles.avatarText}>{initials}</Text>
      </View>

      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={1}>
          {employee.fullName}
        </Text>
        <Text style={cardStyles.meta}>ID: {employee.personCode}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

/* ------------------------------------------------------------------ */
/* EmptyState                                                           */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
  isLoading: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isLoading }) => (
  <View style={emptyStyles.container}>
    <Text style={emptyStyles.text}>{isLoading ? 'Loading...' : 'No employees found'}</Text>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  text: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

/* ------------------------------------------------------------------ */
/* ErrorState                                                           */
/* ------------------------------------------------------------------ */

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <View style={errorStyles.container}>
    <Text style={errorStyles.message}>{message}</Text>
    <TouchableOpacity onPress={onRetry} style={errorStyles.retryButton}>
      <Text style={errorStyles.retryText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
});

/* ------------------------------------------------------------------ */
/* ListFooterLoader                                                     */
/* ------------------------------------------------------------------ */

export const ListFooterLoader: React.FC = () => (
  <View style={footerStyles.container}>
    <ActivityIndicator size="small" color={COLORS.primary} />
  </View>
);

const footerStyles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
});