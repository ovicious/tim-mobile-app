import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';

export default function ShopScreen() {
  const { theme } = useThemeColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <MaterialIcons name="store" size={80} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Gym Shop</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Browse merchandise, supplements, and exclusive gym products.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
