import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/types';

export type ProfileShape = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  weight?: number;
  profile_pic_url?: string;
  language?: string;
};

export function getProfileCompletion(p: ProfileShape | null | undefined) {
  if (!p) return { percent: 0, missing: ['first_name','last_name','date_of_birth','language'] };
  const checks: Array<[string, boolean]> = [
    ['first_name', !!p.first_name],
    ['last_name', !!p.last_name],
    ['date_of_birth', !!p.date_of_birth],
    ['language', !!p.language],
  ];
  const total = checks.length;
  const done = checks.filter(([, ok]) => ok).length;
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  return { percent: Math.round((done / total) * 100), missing };
}

interface Props {
  theme: AppTheme;
  profile: ProfileShape | null;
  onCompletePress: () => void;
}

export const ProfileCompletionCard: React.FC<Props> = ({ theme, profile, onCompletePress }) => {
  const { percent, missing } = getProfileCompletion(profile);
  if (percent >= 100) return null;

  const styles = StyleSheet.create({
    wrap: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.warning,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    title: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginBottom: 6 },
    subtitle: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    chip: { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    chipText: { color: theme.colors.textMuted, fontSize: 12 },
    btn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>{percent}% done • Add details for a better experience</Text>
      <View style={styles.chipRow}>
        {missing.map((m) => (
          <View key={m} style={styles.chip}><Text style={styles.chipText}>{m.replace('_',' ')}</Text></View>
        ))}
      </View>
      <TouchableOpacity onPress={onCompletePress} style={styles.btn}>
        <MaterialIcons name="edit" size={16} color="#fff" />
        <Text style={styles.btnText}>Complete Profile</Text>
      </TouchableOpacity>
    </View>
  );
};
