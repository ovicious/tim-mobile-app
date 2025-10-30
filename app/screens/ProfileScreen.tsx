import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { apiGet } from '../api';
import { useAuth } from '../auth';

export default function ProfileScreen() {
  const { logout } = useAuth();
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
  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!profile) return <Text style={styles.error}>Failed to load profile.</Text>;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.text}>Name: {profile.first_name} {profile.last_name}</Text>
      <Text style={styles.text}>Email: {profile.email}</Text>
      <Text style={styles.text}>Role: {profile.role}</Text>
      <Text style={styles.text}>Business: {profile.business_name || profile.business_id}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, marginBottom: 16, color: theme.colors.text },
  text: { color: theme.colors.text, marginBottom: 6 },
  error: { color: theme.colors.danger, margin: 16 },
  logoutBtn: { marginTop: 20, alignSelf: 'flex-start', backgroundColor: theme.colors.danger, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '700' },
});
