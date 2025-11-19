import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/types';

export type NextClass = {
  id: string;
  class_name?: string;
  start_time?: string;
  instructor_name?: string;
};

interface Props {
  theme: AppTheme;
  nextClass: NextClass | null;
  onPressView: () => void;
}

export const NextClassCard: React.FC<Props> = ({ theme, nextClass, onPressView }) => {
  if (!nextClass) return null;

  const styles = StyleSheet.create({
    wrap: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.primary, padding: 16, marginBottom: 16 },
    title: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginBottom: 6 },
    meta: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctaText: { color: theme.colors.primary, fontWeight: '700' },
  });

  const when = nextClass.start_time ? new Date(nextClass.start_time).toLocaleString() : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Your next class</Text>
      <Text style={styles.meta}>{nextClass.class_name || 'Class'}{when ? ` • ${when}` : ''}{nextClass.instructor_name ? ` • with ${nextClass.instructor_name}` : ''}</Text>
      <TouchableOpacity onPress={onPressView} style={styles.cta}>
        <MaterialIcons name="calendar-today" size={16} color={theme.colors.primary} />
        <Text style={styles.ctaText}>View details</Text>
      </TouchableOpacity>
    </View>
  );
};
