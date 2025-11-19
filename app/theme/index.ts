/**
 * Theme Index
 * 
 * Central export point for theme system.
 * Provides theme retrieval, context, and utility functions.
 */

import { AppTheme, ThemeMode } from './types';
import { lightTheme } from './light';
import { darkTheme } from './dark';
import { Appearance } from 'react-native';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { logger } from '../utils/logger';
import { usePreferences } from '../preferences/PreferencesProvider';

// ============ THEME RETRIEVAL ============

/**
 * Get theme based on mode
 * @param mode - Theme mode ('light' or 'dark')
 * @returns AppTheme object
 */
export const getTheme = (mode: ThemeMode): AppTheme => {
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  logger.debug('getTheme', `Retrieving ${mode} theme`);
  return theme;
};

export { lightTheme, darkTheme };
export type { AppTheme, ThemeMode };

// ============ AUTO THEME DETECTION ============

/**
 * Get initial system theme mode
 * @returns Detected theme mode from device settings
 */
export const getSystemThemeMode = (): ThemeMode => {
  const scheme = Appearance.getColorScheme();
  const mode = scheme === 'dark' ? 'dark' : 'light';
  logger.debug('getSystemThemeMode', `Detected system theme: ${mode}`);
  return mode;
};

/**
 * Hook to dynamically react to system theme changes
 * @returns Object with theme and isDarkMode flag
 */
export function useThemeColors(): { theme: AppTheme; isDarkMode: boolean } {
  try {
    const { resolvedThemeMode } = usePreferences();
    const isDark = resolvedThemeMode === 'dark';
    const theme = isDark ? darkTheme : lightTheme;

    if (!theme) {
      logger.error('useThemeColors', 'Theme object is null or undefined', { isDark });
      return { theme: lightTheme, isDarkMode: false };
    }

    if (!theme.colors) {
      logger.error('useThemeColors', 'Theme.colors is undefined', {
        isDark,
        themeKeys: Object.keys(theme || {}),
      });
      return { theme: lightTheme, isDarkMode: false };
    }

    const requiredColors = ['background', 'text', 'primary', 'surface', 'border'];
    const missingColors = requiredColors.filter(color => !theme.colors[color as keyof typeof theme.colors]);

    if (missingColors.length > 0) {
      logger.error('useThemeColors', 'Theme missing required colors', {
        missingColors,
        isDark,
        availableColors: Object.keys(theme.colors),
      });
      return { theme: lightTheme, isDarkMode: false };
    }

    logger.debug('useThemeColors', 'Theme validated successfully', {
      isDark,
      colorCount: Object.keys(theme.colors).length,
    });

    return { theme, isDarkMode: isDark };
  } catch (error) {
    logger.error('useThemeColors', 'Fatal error in useThemeColors hook', error);
    return { theme: lightTheme, isDarkMode: false };
  }
}

// ============ REACT NAVIGATION INTEGRATION ============

/**
 * Map AppTheme to React Navigation theme
 * @param theme - The app theme object
 * @returns React Navigation compatible theme
 */
export const getNavigationTheme = (theme: AppTheme) => {
  const base = theme.mode === 'dark' ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark: theme.mode === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  } as typeof NavDefaultTheme;
};

// ============ COLOR UTILITY FUNCTIONS ============

/**
 * Convert hex color to rgba with opacity
 * @param color - Hex color (e.g., '#FF0000')
 * @param opacity - Opacity value 0-1 (e.g., 0.1 for 10%)
 * @returns rgba color string
 */
export const hexToRgba = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Create status background color with appropriate opacity
 * @param status - Status type (success, error, warning, info)
 * @param theme - The app theme
 * @param opacity - Custom opacity (defaults to 0.1)
 * @returns Background color string
 */
export const getStatusBackground = (
  status: 'success' | 'error' | 'warning' | 'info',
  theme: AppTheme,
  opacity: number = 0.1
): string => {
  return hexToRgba(theme.colors[status], opacity);
};

/**
 * Create error background for light/dark mode
 * @param theme - The app theme
 * @returns Background color string
 */
export const getErrorBackground = (theme: AppTheme): string => {
  return theme.mode === 'dark' 
    ? hexToRgba(theme.colors.error, 0.1) 
    : hexToRgba(theme.colors.error, 0.15);
};

/**
 * Create success background for light/dark mode
 * @param theme - The app theme
 * @returns Background color string
 */
export const getSuccessBackground = (theme: AppTheme): string => {
  return theme.mode === 'dark' 
    ? hexToRgba(theme.colors.success, 0.1) 
    : hexToRgba(theme.colors.success, 0.15);
};

/**
 * Create warning background for light/dark mode
 * @param theme - The app theme
 * @returns Background color string
 */
export const getWarningBackground = (theme: AppTheme): string => {
  return theme.mode === 'dark' 
    ? hexToRgba(theme.colors.warning, 0.1) 
    : hexToRgba(theme.colors.warning, 0.15);
};

/**
 * Create info background for light/dark mode
 * @param theme - The app theme
 * @returns Background color string
 */
export const getInfoBackground = (theme: AppTheme): string => {
  return theme.mode === 'dark' 
    ? hexToRgba(theme.colors.info, 0.1) 
    : hexToRgba(theme.colors.info, 0.15);
};

// Note: Theme preferences are managed via PreferencesProvider.tsx
// This keeps TypeScript .ts files pure while JSX components use .tsx
