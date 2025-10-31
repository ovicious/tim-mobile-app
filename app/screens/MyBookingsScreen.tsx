import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, getMyBookings, cancelBooking } from '../api';
import { useThemeColors } from '../theme';

type Booking = {
  id: string;
  class_id: string;
  class_name?: string;
  business_id: string;
  start_time?: string;
};

export default function MyBookingsScreen() {
  const { theme } = useThemeColors();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile();
        const bid = profile?.data?.business_id || profile?.business_id;
        setBusinessId(bid);
        if (bid) {
          const res = await getMyBookings(bid);
          const list = res?.data || res || [];
          setBookings(list);
        }
      } catch (e) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const onCancel = (bk: Booking) => {
    if (!businessId) return;
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          setWorking(bk.id);
          try {
            await cancelBooking(businessId, bk.class_id, bk.id);
            setBookings(prev => prev.filter(b => b.id !== bk.id));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to cancel booking');
          } finally {
            setWorking(null);
          }
        },
      },
    ]);
  };

  const now = new Date();
  const categorized = useMemo(() => {
    const upc = [] as Booking[];
    const pst = [] as Booking[];
    const can = [] as Booking[];
    bookings.forEach(b => {
      const d = b.start_time ? new Date(b.start_time) : null;
      if ((b as any).status === 'cancelled') can.push(b);
      else if (d && d > now) upc.push(b);
      else pst.push(b);
    });
    // Sort upcoming by soonest
    upc.sort((a, b) => (new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime()));
    // Sort past by newest first
    pst.sort((a, b) => (new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime()));
    return { upc, pst, can };
  }, [bookings]);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} size="large" color={theme.colors.primary} />;

  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>My Bookings</Text>
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {(['upcoming','past','cancelled'] as const).map(k => (
          <TouchableOpacity key={k} style={[styles.tab, tab===k && { backgroundColor: theme.colors.primary }]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, { color: tab===k ? '#fff' : theme.colors.text }]}>{k[0].toUpperCase()+k.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'upcoming' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {categorized.upc.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No upcoming bookings.</Text>
          ) : (
            categorized.upc.map(b => (
              <View key={b.id} style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dateBubble, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.dateBubbleText}>{new Date(b.start_time||'').getDate()}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.name, { color: theme.colors.primary }]}>{b.class_name || b.class_id}</Text>
                    <Text style={[styles.meta, { color: theme.colors.text }]}>{new Date(b.start_time||'').toLocaleString()}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.colors.danger }]} onPress={() => onCancel(b)} disabled={working === b.id}>
                  <Text style={styles.cancelText}>{working === b.id ? 'Cancelling…' : 'Cancel'}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {tab === 'past' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {categorized.pst.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No past bookings.</Text>
          ) : (
            categorized.pst.map(b => {
              const attended = ((b as any).status === 'attended');
              return (
                <View key={b.id} style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.colors.primary }]}>{b.class_name || b.class_id}</Text>
                    <Text style={[styles.meta, { color: theme.colors.text }]}>{new Date(b.start_time||'').toLocaleString()}</Text>
                  </View>
                  <Ionicons name={attended ? 'checkmark-circle' : 'close-circle'} size={22} color={attended ? '#16A34A' : '#DC2626'} />
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {tab === 'cancelled' && (
        <FlatList
          data={categorized.can}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.textMuted }]}>No cancelled bookings.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.colors.primary }]}>{item.class_name || item.class_id}</Text>
                {!!item.start_time && (
                  <Text style={[styles.meta, { color: theme.colors.text }]}>{new Date(item.start_time).toLocaleString()}</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerBase: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, alignSelf: 'center' },
  tabs: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabText: { fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 24 },
  row: { borderRadius: 10, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 4 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  cancelText: { color: '#fff', fontWeight: '700' },
  dateBubble: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dateBubbleText: { color: '#fff', fontWeight: '700' },
});
