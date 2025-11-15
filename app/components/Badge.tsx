/**
 * Badge Component
 * 
 * Small status indicator badge for displaying status or labels.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AppTheme } from '../theme/types';

interface BadgeProps {
  theme: AppTheme;
  text: string;
  variant?: 'default' | 'active' | 'inactive' | 'success' | 'error' | 'warning' | 'info';
  style?: ViewStyle;
  textColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  theme,
  text,
  variant = 'default',
  style,
  textColor,
}) => {
  const getVariantStyle = (): ViewStyle => {
    const styles: Record<string, ViewStyle> = {
      default: {
        backgroundColor:
          theme.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
      },
      active: {
        backgroundColor: `${theme.colors.primary}20`,
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      inactive: {
        backgroundColor:
          theme.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
        borderWidth: 1,
        borderColor:
          theme.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
      },
      success: {
        backgroundColor: `${theme.colors.success}20`,
        borderWidth: 1,
        borderColor: theme.colors.success,
      },
      error: {
        backgroundColor: `${theme.colors.error}20`,
        borderWidth: 1,
        borderColor: theme.colors.error,
      },
      warning: {
        backgroundColor: `${theme.colors.warning}20`,
        borderWidth: 1,
        borderColor: theme.colors.warning,
      },
      info: {
        backgroundColor: `${theme.colors.info}20`,
        borderWidth: 1,
        borderColor: theme.colors.info,
      },
    };

    return styles[variant] || styles.default;
  };

  const getTextColor = (): string => {
    if (textColor) return textColor;

    const colors: Record<string, string> = {
      default: theme.colors.text,
      active: theme.colors.primary,
      inactive: theme.colors.textMuted,
      success: theme.colors.success,
      error: theme.colors.error,
      warning: theme.colors.warning,
      info: theme.colors.info,
    };

    return colors[variant] || colors.default;
  };

  const badgeStyles = StyleSheet.create({
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      ...getVariantStyle(),
    },
    text: {
      fontSize: 12,
      fontWeight: '500',
      color: getTextColor(),
    },
  });

  return (
    <View style={[badgeStyles.badge, style]}>
      <Text style={badgeStyles.text}>{text}</Text>
    </View>
  );
};
