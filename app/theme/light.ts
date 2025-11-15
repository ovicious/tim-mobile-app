/**
 * Light Theme
 * 
 * Light mode color scheme for the Member App.
 * High contrast for readability in bright environments.
 */

import { AppTheme } from './types';

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    // Primary & Secondary
    primary: '#4C8BFF',
    secondary: '#6B7280',
    
    // Status Colors
    success: '#16A34A',
    error: '#DC2626',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Background & Surface
    background: '#FFFFFF',
    surface: '#F8F9FB',
    surfaceAlt: '#FFFFFF',
    
    // Text
    text: '#111827',
    textMuted: '#6B7280',
    
    // Borders & Dividers
    border: '#E6E8EC',
    divider: '#E5E7EB',
    
    // Input
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
    placeholder: '#9CA3AF',
    
    // Navigation
    tabBg: '#FFFFFF',
  },
};
