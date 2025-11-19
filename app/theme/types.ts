/**
 * Theme Type Definitions
 * 
 * Defines the complete theme structure for both light and dark modes.
 * Used throughout the app for type-safe theme access.
 */

export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    // Primary & Secondary
    primary: string;
    primaryDark?: string;
    primaryLight?: string;
    secondary: string;
    
    // Status Colors
    success: string;
    successLight?: string;
    error: string;
    errorLight?: string;
    warning: string;
    warningLight?: string;
    info: string;
    infoLight?: string;
    
    // Background & Surface
    background: string;
    surface: string;
    surfaceAlt: string;
    
    // Text
    text: string;
    textSecondary?: string;
    textMuted: string;
    textInverse?: string;
    
    // Borders & Dividers
    border: string;
    divider: string;
    
    // Input
    inputBg: string;
    inputBorder: string;
    placeholder: string;
    
    // Navigation
    tabBg: string;
    
    // Special
    gradient?: string[];
  };
};
