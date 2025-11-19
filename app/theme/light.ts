/**
 * Light Theme
 *
 * Modern light mode color scheme for the Member App.
 * Professional and clean design with excellent readability.
 */

import { AppTheme } from './types';

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    // Professional primary colors
    primary: '#2563EB', // Modern blue
    primaryDark: '#1D4ED8', // Darker blue for gradients
    primaryLight: '#3B82F6', // Lighter blue for highlights
    secondary: '#64748B', // Professional gray
    
    // Enhanced status colors
    success: '#10B981', // Modern green
    successLight: '#D1FAE5', // Light green background
    error: '#EF4444', // Modern red
    errorLight: '#FEE2E2', // Light red background
    warning: '#F59E0B', // Modern orange
    warningLight: '#FEF3C7', // Light orange background
    info: '#3B82F6', // Modern blue
    infoLight: '#DBEAFE', // Light blue background
    
    // Clean backgrounds
    background: '#F8FAFC', // Clean light gray
    surface: '#FFFFFF', // Pure white for cards
    surfaceAlt: '#F1F5F9', // Subtle alternate surface
    
    // Professional text hierarchy
    text: '#1E293B', // Dark slate for primary text
    textSecondary: '#475569', // Medium gray for secondary text
    textMuted: '#64748B', // Light gray for muted text
    textInverse: '#FFFFFF', // White text for dark backgrounds
    
    // Modern borders and dividers
    border: '#E2E8F0', // Subtle borders
    divider: '#CBD5E0', // Divider lines
    
    // Enhanced input styling
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0',
    placeholder: '#94A3B8',
    
    // Modern navigation
    tabBg: '#FFFFFF',
    
    // Gradient support
    gradient: ['#2563EB', '#1D4ED8'], // Primary gradient
  },
};
