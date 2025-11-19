import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/types';

export type ProfileSummary = { first_name?: string; last_name?: string; email?: string };

interface Props {
  theme: AppTheme;
  profile: ProfileSummary | null;
  onPressEdit: () => void;
}

export const ProfileQuickAccessCard: React.FC<Props> = ({ theme, profile, onPressEdit }) => {
  if (!profile) return null;

  const styles = StyleSheet.create({
    wrap: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1 },
    name: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginBottom: 2 },
    email: { color: theme.colors.textMuted, fontSize: 13 },
    btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.primary },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  });

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Member';

  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <MaterialIcons name="person" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{fullName}</Text>
        {profile.email && <Text style={styles.email}>{profile.email}</Text>}
      </View>
      <TouchableOpacity onPress={onPressEdit} style={styles.btn}>
        <Text style={styles.btnText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
};
