/**
 * Card Component
 * 
 * Reusable card wrapper for displaying content with consistent styling.
 * Supports variants for different use cases.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppTheme } from '../theme/types';

interface CardProps {
  theme: AppTheme;
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'surface';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  theme, 
  children, 
  style, 
  variant = 'default',
  onPress 
}) => {
  const styles = StyleSheet.create({
    card: {
      backgroundColor:
        variant === 'surface'
          ? theme.colors.surfaceAlt
          : theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: variant === 'primary' ? 2 : 1,
      borderColor:
        variant === 'primary'
          ? theme.colors.primary
          : theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};
