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
    secondary: string;
    
    // Status Colors
    success: string;
    error: string;
    warning: string;
    info: string;
    
    // Background & Surface
    background: string;
    surface: string;
    surfaceAlt: string;
    
    // Text
    text: string;
    textMuted: string;
    
    // Borders & Dividers
    border: string;
    divider: string;
    
    // Input
    inputBg: string;
    inputBorder: string;
    placeholder: string;
    
    // Navigation
    tabBg: string;
  };
};
