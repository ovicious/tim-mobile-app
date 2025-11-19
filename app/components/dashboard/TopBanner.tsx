import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppTheme } from '../../theme/types';

interface Props {
  theme: AppTheme;
  shortName?: string;
}

// Simple branded banner centered on top of Dashboard
export const TopBanner: React.FC<Props> = ({ theme, shortName }) => {
  const styles = StyleSheet.create({
    wrap: {
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.primary + '15',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    text: {
      color: theme.colors.primary,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.wrap} accessible accessibilityRole="header" accessibilityLabel={shortName || "Gym"}>
      <View style={styles.badge}>
        <Text style={styles.text}>{shortName || "GYM"}</Text>
      </View>
    </View>
  );
};
