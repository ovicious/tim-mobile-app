import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../api';
import { useThemeColors } from '../theme';

// Minimal shape for gyms the user belongs to
type UserGym = { business_id: string; name: string };

export default function NewBookingScreen() {
  const { theme } = useThemeColors();
  const navigation = useNavigation<any>();
  const [gyms, setGyms] = useState<UserGym[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile();
        const data = profile?.data ?? profile ?? {};
        // Try multiple shapes to stay compatible
        const arr: UserGym[] =
          data?.businesses?.map((b: any) => ({ business_id: b.business_id || b.id, name: b.name })) ||
          (data?.business_id ? [{ business_id: data.business_id, name: data.business_name || 'My Gym' }] : []);
        setGyms(arr);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} color={theme.colors.primary} size="large" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Select a Gym</Text>
      <FlatList
        data={gyms}
        keyExtractor={(g) => g.business_id}
        ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, alignSelf: 'center', marginTop: 20 }}>No gyms found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('BookClass', { businessId: item.business_id })}
          >
            <Ionicons name="fitness-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.cardText, { color: theme.colors.text }]}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', alignSelf: 'center', marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1, marginVertical: 8 },
  cardText: { fontSize: 16, fontWeight: '600', marginLeft: 10, flex: 1 },
});
