import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getProfile } from '../api';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card } from '../components';
import { useAuth } from '../auth';

// Minimal shape for gyms the user belongs to
type UserGym = { business_id: string; name: string; status?: string };

function initialsFromName(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts.length > 1 ? parts[1][0] : '';
  return (first + second).toUpperCase() || (name?.[0]?.toUpperCase() || 'G');
}

export default function NewBookingScreen() {
  const { theme } = useThemeColors();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const [gyms, setGyms] = useState<UserGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sharedStyles = useMemo(() => theme ? createSharedStyles(theme) : {} as any, [theme]);
  const styles = useMemo(() => theme ? createNewBookingStyles(theme) : {} as any, [theme]);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        console.log('[NewBookingScreen] Loading user profile...');
        const profile = await getProfile();
        console.log('[NewBookingScreen] Profile received:', {
          hasData: !!profile?.data,
          hasBusinessId: !!profile?.data?.business_id || !!profile?.business_id,
          businessCount: profile?.data?.businesses?.length || profile?.businesses?.length || 0,
        });
        
        const data = profile?.data ?? profile ?? {};
        // Try multiple shapes to stay compatible
        const arr: UserGym[] =
          data?.businesses?.map((b: any) => ({ business_id: b.business_id || b.id, name: b.name, status: b.membership_status || b.status })) ||
          (data?.business_id ? [{ business_id: data.business_id, name: data.business_name || 'My Gym', status: 'active' }] : []);
        
        console.log('[NewBookingScreen] All gyms found:', arr);
        
        // Prefer gyms where membership is active/approved if status present
        const filtered = arr.filter(g => !g.status || /(active|approved)/i.test(g.status));
        console.log('[NewBookingScreen] Filtered active/approved gyms:', filtered);
        
        setGyms(filtered);
        
        if (filtered.length === 0 && arr.length > 0) {
          setError('No active gym memberships found. Please contact support.');
        } else if (filtered.length === 0) {
          setError('No gyms found in your profile. Please complete your profile.');
        }
      } catch (e: any) {
        console.error('[NewBookingScreen] Error loading profile:', e);
        
        if (e?.code === 401 || e?.response?.status === 401) {
          console.log('[NewBookingScreen] Session issue detected.');
          setError('Session issue detected. Please retry.');
          return;
        }
        
        const errorMsg = e?.message || e?.response?.data?.message || 'Failed to load gyms. Please try again.';
        setError(errorMsg);
        console.warn('[NewBookingScreen] Non-fatal error:', errorMsg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Defensive check for theme after all hooks are called
  if (!theme || !theme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={[styles.container, { backgroundColor: theme.colors.background }]} color={theme.colors.primary} size="large" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Select a Gym</Text>
      
      {/* Error message display */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={gyms}
        keyExtractor={(g) => g.business_id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No gyms found.</Text>}
        renderItem={({ item }) => (
          <Card
            theme={theme}
            variant="default"
            style={styles.card}
            onPress={() => navigation.navigate('Gym', { businessId: item.business_id })}
          >
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.logoText}>{initialsFromName(item.name)}</Text>
            </View>
            <Text style={[styles.cardText, { color: theme.colors.text }]}>{item.name}</Text>
            <MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
          </Card>
        )}
      />
    </View>
  );
}

function createNewBookingStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 18, fontWeight: '700', alignSelf: 'center', marginBottom: 12 },
    card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12 },
    logoCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    logoText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cardText: { flex: 1, fontSize: 16, fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
    errorBanner: {
      padding: 12,
      borderRadius: 6,
      marginBottom: 12,
    },
    errorText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
    },
  });
}
