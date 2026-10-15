export const Colors = {
  // Brand colors
  primary: '#0284C7', // Sky Blue / Medical Teal-Blue
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',
  primaryMuted: '#BAE6FD',

  // Secondary & Accents
  accent: '#0D9488', // Deep Teal
  accentLight: '#CCFBF1',
  
  // Status Colors
  success: '#10B981', // Emerald for Taken / Normal
  successLight: '#D1FAE5',
  warning: '#F59E0B', // Amber for Due Soon / Low Stock
  warningLight: '#FEF3C7',
  danger: '#EF4444', // Rose for Missed / Alert
  dangerLight: '#FEE2E2',
  info: '#6366F1', // Indigo for As-needed

  // Neutrals & Backgrounds
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  cardMuted: '#F1F5F9', // Slate 100
  border: '#E2E8F0', // Slate 200
  borderLight: '#F1F5F9',
  
  // Typography
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  // Pill visual colors
  pillColors: [
    { name: 'Sky Blue', hex: '#0284C7' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Teal', hex: '#0D9488' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Indigo', hex: '#6366F1' },
  ],
};

export const Shadows = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
