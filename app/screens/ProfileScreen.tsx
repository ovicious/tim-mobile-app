import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button } from '../components';
import { apiGet } from '../api';
import { useAuth } from '../auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createProfileStyles(theme), [theme]);
  
  useEffect(() => {
    apiGet('/api/v1/auth/profile')
      .then((resp) => {
        // Backend wraps payload in { success, message, data }
        const data = resp?.data ?? resp;
        setProfile(data);
      })
      .catch((e: any) => {
        // If unauthorized, log out to return to Login
        if (e?.code === 401) {
          logout();
          return;
        }
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} color={theme.colors.primary} />;
  if (!profile) return <View style={[styles.container, { backgroundColor: theme.colors.background }]}><Text style={[styles.error, { color: theme.colors.error }]}>Failed to load profile.</Text></View>;
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
      
      <Card theme={theme} variant="default" style={styles.infoCard}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Name</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{profile.first_name} {profile.last_name}</Text>
      </Card>

      <Card theme={theme} variant="default" style={styles.infoCard}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Email</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{profile.email}</Text>
      </Card>

      <Card theme={theme} variant="default" style={styles.infoCard}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Role</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{profile.role}</Text>
      </Card>

      <Card theme={theme} variant="default" style={styles.infoCard}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Gym</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{profile.business_name || profile.business_id}</Text>
      </Card>

      <Button 
        theme={theme} 
        title="Logout" 
        onPress={logout}
        variant="danger"
        fullWidth
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

function createProfileStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 24, marginBottom: 24, fontWeight: '700' },
    infoCard: { marginBottom: 12 },
    label: { fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
    value: { fontSize: 16, fontWeight: '500' },
    error: { margin: 16, fontSize: 16 },
    logoutBtn: { marginTop: 32 },
  });
}
