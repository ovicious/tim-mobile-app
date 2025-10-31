import { Appearance, useColorScheme } from 'react-native';

export type AppTheme = {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    danger: string;
    success: string;
    inputBg: string;
    inputBorder: string;
    placeholder: string;
    tabBg: string;
  };
};

export const lightTheme: AppTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FB',
    surfaceAlt: '#FFFFFF',
    border: '#E6E8EC',
    text: '#111827',
    textMuted: '#6B7280',
    primary: '#4C8BFF',
    danger: '#DC2626',
    success: '#16A34A',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
    placeholder: '#9CA3AF',
    tabBg: '#FFFFFF',
  },
};

export const darkTheme: AppTheme = {
  colors: {
    background: '#0B0B0D',
    surface: '#121214',
    surfaceAlt: '#1A1B1E',
    border: '#232327',
    text: '#EAEAEA',
    textMuted: '#A9A9B2',
    primary: '#4C8BFF',
    danger: '#FF4D4F',
    success: '#28C76F',
    inputBg: '#1E1F24',
    inputBorder: '#2C2D33',
    placeholder: '#8A8F98',
    tabBg: '#111114',
  },
};

// Auto-detect device color scheme at startup
const scheme = Appearance.getColorScheme();
export const isDarkMode = scheme === 'dark';
export const theme: AppTheme = isDarkMode ? darkTheme : lightTheme;

// Hook to dynamically react to system theme changes
export function useThemeColors(): { theme: AppTheme; isDarkMode: boolean } {
  const schemeHook = useColorScheme();
  const dark = schemeHook === 'dark';
  return { theme: dark ? darkTheme : lightTheme, isDarkMode: dark };
}
