import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
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
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
        const err: any = e;
        if (err?.code === 401) {
          alert('Your session expired. Please log in again.');
          // @ts-ignore
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Helper to get YYYY-MM-DD
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const selectedYMD = useMemo(() => ymd(selectedDate), [selectedDate]);

  // Preload sessions for all classes (once) when business/classes ready
  useEffect(() => {
    async function ensureSessions() {
      if (!businessId || classes.length === 0) return;
      const missing = classes.filter(c => !sessionsByClass[c.id]);
      if (missing.length === 0) return;
      setLoadingSessions(true);
      try {
        const results = await Promise.all(
          missing.map(async (c) => {
            const res = await getSessionsForClass(businessId, c.id);
            const arr: Session[] = res?.data || res || [];
            return [c.id, arr] as const;
          })
        );
        setSessionsByClass(prev => {
          const next = { ...prev };
          for (const [cid, arr] of results) next[cid] = arr;
          return next;
        });
      } finally {
        setLoadingSessions(false);
      }
    }
    ensureSessions();
  }, [businessId, classes]);

  const toggleExpand = async (classId: string) => {
    if (!businessId) return;
    if (expandedClassId === classId) {
      setExpandedClassId(null);
      return;
    }
    setExpandedClassId(classId);
    if (!sessionsByClass[classId]) {
      try {
        const sessions = await getSessionsForClass(businessId, classId);
        setSessionsByClass(prev => ({ ...prev, [classId]: sessions?.data || sessions }));
      } catch (e: any) {
        if (e?.code === 401) {
          alert('Your session expired. Please log in again.');
          // @ts-ignore
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
      }
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

      {/* Date selector strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
        {useMemo(() => {
          const arr: Date[] = [];
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          for (let i = 0; i < 14; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            arr.push(d);
          }
          return arr;
        }, []).map((d) => {
          const isSelected = ymd(d) === selectedYMD;
          return (
            <TouchableOpacity
              key={ymd(d)}
              style={[
                styles.datePill,
                { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[styles.datePillDow, { color: isSelected ? '#fff' : theme.colors.text }]}>
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.datePillDom, { color: isSelected ? '#fff' : theme.colors.text }]}>{d.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Combined sessions for selected date */}
      {(() => {
        const items: Array<{ session: Session; classId: string; className: string }> = [];
        for (const c of classes) {
          const list = sessionsByClass[c.id] || [];
          for (const s of list) {
            if ((s.start_time || '').slice(0, 10) === selectedYMD) items.push({ session: s, classId: c.id, className: c.name });
          }
        }
        items.sort((a, b) => a.session.start_time.localeCompare(b.session.start_time));
        if (loadingSessions && items.length === 0) return <ActivityIndicator style={{ marginTop: 16 }} color={theme.colors.primary} />;
        if (items.length === 0) return <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No sessions available for this date.</Text>;
        return (
          <FlatList
            data={items}
            keyExtractor={(it) => it.session.id}
            renderItem={({ item }) => (
              <View style={[styles.sessionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionTime, { color: theme.colors.text }]}>
                    {new Date(item.session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.className, { color: theme.colors.primary }]}>{item.className}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleBook(item.classId, item.session.id)}
                  disabled={booking === item.session.id}
                >
                  <Text style={styles.bookButtonText}>{booking === item.session.id ? 'Booking…' : 'Book'}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        );
      })()}
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
  emptyText: { alignSelf: 'center', marginVertical: 12 },
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
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
  datePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  datePillDow: {
    fontSize: 12,
    fontWeight: '600',
  },
  datePillDom: {
    fontSize: 16,
    fontWeight: '700',
  },
});
