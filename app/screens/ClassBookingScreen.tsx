import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProfile, getClassesForBusiness, getSessionsForClass, bookClassSession } from '../api';
import { useThemeColors } from '../theme';

type GymClass = { id: string; name: string; description?: string };
type Session = { id: string; start_time: string; end_time?: string; available_slots?: number };

export default function ClassBookingScreen() {
  const { theme } = useThemeColors();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [sessionsByClass, setSessionsByClass] = useState<Record<string, Session[]>>({});
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const navigation = useNavigation();
  const route = useRoute<any>();

  useEffect(() => {
    async function init() {
      try {
        const routeBusinessId = route?.params?.businessId as string | undefined;
        const profile = !routeBusinessId ? await getProfile() : null;
        const bid = routeBusinessId || profile?.data?.business_id || profile?.business_id;
        setBusinessId(bid);
        if (bid) {
          const cls = await getClassesForBusiness(bid);
          setClasses(cls?.data || cls);
        }
      } catch (e) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const toggleExpand = async (classId: string) => {
    if (!businessId) return;
    if (expandedClassId === classId) {
      setExpandedClassId(null);
      return;
    }
    setExpandedClassId(classId);
    if (!sessionsByClass[classId]) {
      const sessions = await getSessionsForClass(businessId, classId);
      setSessionsByClass(prev => ({ ...prev, [classId]: sessions?.data || sessions }));
    }
  };

  const handleBook = async (classId: string, sessionId: string) => {
    if (!businessId) return;
    setBooking(sessionId);
    try {
      await bookClassSession(businessId, classId, sessionId);
      alert('Class booked successfully!');
    } catch (e: any) {
      alert(`Booking failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setBooking(null);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} size="large" color={theme.colors.primary} />;
  }

  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Book a Class</Text>
      {!businessId ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>No business found in profile.</Text>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item: GymClass) => item.id}
          renderItem={({ item }: { item: GymClass }) => (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                <Text style={[styles.className, { color: theme.colors.primary }]}>{item.name}</Text>
                {!!item.description && <Text style={[styles.classDesc, { color: theme.colors.textMuted }]}>{item.description}</Text>}
              </TouchableOpacity>
              {expandedClassId === item.id && (
                <View style={styles.sessionList}>
                  {(sessionsByClass[item.id] || []).map((s) => (
                    <View key={s.id} style={styles.sessionRow}>
                      <Text style={[styles.classTime, { color: theme.colors.text }]}>{new Date(s.start_time).toLocaleString()}</Text>
                      <TouchableOpacity
                        style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleBook(item.id, s.id)}
                        disabled={booking === s.id}
                      >
                        <Text style={styles.bookButtonText}>{booking === s.id ? 'Booking…' : 'Book'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerBase: { flex: 1, padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 10,
    padding: 18,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
  },
  classDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  className: {
    fontSize: 18,
    fontWeight: '500',
  },
  classTime: {
    fontSize: 15,
    marginBottom: 8,
  },
  sessionList: {
    marginTop: 8,
    gap: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  bookButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: { alignSelf: 'center' },
});
