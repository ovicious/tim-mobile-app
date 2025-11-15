/**
 * Dark Theme
 * 
 * Dark mode color scheme for the Member App.
 * Optimized for low-light environments with reduced eye strain.
 */

import { AppTheme } from './types';

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    // Primary & Secondary
    primary: '#4C8BFF',
    secondary: '#A9A9B2',
    
    // Status Colors
    success: '#28C76F',
    error: '#FF4D4F',
    warning: '#FFA940',
    info: '#1890FF',
    
    // Background & Surface
    background: '#0B0B0D',
    surface: '#121214',
    surfaceAlt: '#1A1B1E',
    
    // Text
    text: '#EAEAEA',
    textMuted: '#A9A9B2',
    
    // Borders & Dividers
    border: '#232327',
    divider: '#2C2D33',
    
    // Input
    inputBg: '#1E1F24',
    inputBorder: '#2C2D33',
    placeholder: '#8A8F98',
    
    // Navigation
    tabBg: '#111114',
  },
};
