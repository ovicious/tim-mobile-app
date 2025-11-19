/**
 * Dark Theme
 *
 * Modern dark mode color scheme for the Member App.
 * Optimized for low-light environments with professional aesthetics.
 */

import { AppTheme } from './types';

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    // Professional primary colors for dark mode
    primary: '#3B82F6', // Lighter blue for dark mode
    primaryDark: '#2563EB', // Medium blue
    primaryLight: '#60A5FA', // Very light blue
    secondary: '#94A3B8', // Light gray accent
    
    // Enhanced status colors for dark mode
    success: '#34D399', // Lighter green for dark mode
    successLight: '#1E293B', // Dark green background
    error: '#F87171', // Lighter red for dark mode
    errorLight: '#1E293B', // Dark red background
    warning: '#FBBF24', // Lighter orange for dark mode
    warningLight: '#1E293B', // Dark orange background
    info: '#60A5FA', // Lighter blue for dark mode
    infoLight: '#1E293B', // Dark blue background
    
    // Modern dark backgrounds
    background: '#0F172A', // Deep dark blue-gray
    surface: '#1E293B', // Card surfaces
    surfaceAlt: '#334155', // Alternate card color
    
    // Professional text hierarchy for dark mode
    text: '#F8FAFC', // Almost white
    textSecondary: '#CBD5E0', // Light gray
    textMuted: '#94A3B8', // Medium gray
    textInverse: '#1E293B', // Dark text for light backgrounds
    
    // Modern borders and dividers for dark mode
    border: '#334155', // Subtle borders
    divider: '#475569', // Divider lines
    
    // Enhanced input styling for dark mode
    inputBg: '#1E293B',
    inputBorder: '#334155',
    placeholder: '#64748B',
    
    // Modern navigation for dark mode
    tabBg: '#0F172A',
    
    // Gradient support for dark mode
    gradient: ['#3B82F6', '#2563EB'], // Lighter gradient for dark mode
  },
};
