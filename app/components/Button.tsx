/**
 * Button Component
 * 
 * Reusable button component with multiple variants.
 * Supports primary, secondary, and danger button styles.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { AppTheme } from '../theme/types';

interface ButtonProps {
  theme: AppTheme;
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  theme,
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.5 : 1,
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingHorizontal: 16, paddingVertical: 8 } as ViewStyle,
      medium: { paddingHorizontal: 24, paddingVertical: 12 } as ViewStyle,
      large: { paddingHorizontal: 32, paddingVertical: 16 } as ViewStyle,
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      } as ViewStyle,
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
      } as ViewStyle,
      danger: {
        backgroundColor: theme.colors.error,
      } as ViewStyle,
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? '100%' : 'auto',
    } as ViewStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseText: TextStyle = {
      fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
      fontWeight: '600',
      marginRight: loading ? 8 : 0,
    };

    const variantTexts: Record<string, TextStyle> = {
      primary: { color: '#FFFFFF' } as TextStyle,
      secondary: { color: theme.colors.primary } as TextStyle,
      danger: { color: '#FFFFFF' } as TextStyle,
    };

    return { ...baseText, ...variantTexts[variant] } as TextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator 
          color={variant === 'secondary' ? theme.colors.primary : '#FFFFFF'} 
          size="small"
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};
