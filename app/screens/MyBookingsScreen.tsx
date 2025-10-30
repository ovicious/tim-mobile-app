import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getProfile, getMyBookings, cancelBooking } from '../api';

type Booking = {
  id: string;
  class_id: string;
  class_name?: string;
  business_id: string;
  start_time?: string;
};

export default function MyBookingsScreen() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.class_name || item.class_id}</Text>
              {!!item.start_time && (
                <Text style={styles.meta}>{new Date(item.start_time).toLocaleString()}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(item)} disabled={working === item.id}>
              <Text style={styles.cancelText}>{working === item.id ? 'Cancelling…' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#222', alignSelf: 'center' },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  meta: { fontSize: 13, color: '#666', marginTop: 4 },
  cancelBtn: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  cancelText: { color: '#fff', fontWeight: '700' },
});
