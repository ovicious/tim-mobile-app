import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';

export default function CreditScreen() {
  const { theme } = useThemeColors();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
    title: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    subtitle: { fontSize: 13, color: theme.colors.textMuted },
  }), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credit</Text>
      <Text style={styles.subtitle}>Coming soon.</Text>
    </View>
  );
}
