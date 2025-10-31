import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme';
import { apiGet } from '../api';
import { useAuth } from '../auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    apiGet('/api/v1/auth/profile')
      .then((resp) => {
        // Backend wraps payload in { success, message, data }
        const data = resp?.data ?? resp;
        setProfile(data);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} color={theme.colors.primary} />;
  if (!profile) return <View style={styles.container}><Text style={styles.error}>Failed to load profile.</Text></View>;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.infoCard}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile.first_name} {profile.last_name}</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.email}</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{profile.role}</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.label}>Gym</Text>
        <Text style={styles.value}>{profile.business_name || profile.business_id}</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 24, marginBottom: 24, color: theme.colors.text, fontWeight: '700' },
  infoCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: theme.colors.text, fontWeight: '500' },
  error: { color: theme.colors.danger, margin: 16, fontSize: 16 },
  logoutBtn: {
    marginTop: 32,
    backgroundColor: theme.colors.danger,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
