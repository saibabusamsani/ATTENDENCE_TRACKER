export const COLORS = {
  primary: '#3B66D6',
  primaryDark: '#111E38',
  background: '#F4F7FC',
  surface: '#FFFFFF',
  border: '#EBF0FA',

  textPrimary: '#111E38',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  textInverse: '#FFFFFF',

  success: '#2EC4B6',
  successBg: '#E6F9F6',
  warning: '#FF9F1C',
  warningBg: '#FFF5E6',
  danger: '#E71D36',
  dangerBg: '#FFEBEB',
  infoBg: '#EEF2FC',

  // Left-to-right gradient built off `primary` — used for active
  // tabs/chips instead of a flat fill.
  gradientPrimary: ['#5C86E8', '#3B66D6'],

  avatarPalette: ['#3B66D6', '#109B75', '#E71D36', '#7C3AED', '#DB8F0C', '#0891B2'],

  overlayLight: 'rgba(255, 255, 255, 0.08)',
  overlayLighter: 'rgba(255, 255, 255, 0.04)',
} as const;

export const getAvatarColor = (personCode: string): string => {
  let hash = 0;
  for (let i = 0; i < personCode.length; i++) {
    hash = personCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS.avatarPalette[Math.abs(hash) % COLORS.avatarPalette.length];
};