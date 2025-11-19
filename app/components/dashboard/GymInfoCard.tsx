import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/types';

export type GymInfo = { name?: string; address?: string };

interface Props {
  theme: AppTheme;
  gym: GymInfo | null;
  onPressClasses: () => void;
}

export const GymInfoCard: React.FC<Props> = ({ theme, gym, onPressClasses }) => {
  if (!gym || (!gym.name && !gym.address)) return null;

  const styles = StyleSheet.create({
    wrap: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16 },
    title: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginBottom: 6 },
    meta: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
    btn: { alignSelf: 'flex-start', backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
    btnText: { color: '#fff', fontWeight: '700' },
  });

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onPressClasses} activeOpacity={0.7}>
        <Text style={styles.title}>{gym.name || 'Your Gym'}</Text>
      </TouchableOpacity>
      {gym.address ? <Text style={styles.meta}>{gym.address}</Text> : null}
      <TouchableOpacity onPress={onPressClasses} style={styles.btn}>
        <MaterialIcons name="event-note" size={16} color="#fff" />
        <Text style={styles.btnText}>Browse Classes</Text>
      </TouchableOpacity>
    </View>
  );
};
