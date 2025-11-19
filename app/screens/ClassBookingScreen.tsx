import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getProfile, getClassesForBusiness, getSessionsForClass, bookClassSession } from '../api';
import { useThemeColors } from '../theme';
import { useAuth } from '../auth';

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
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { logout } = useAuth();

  useEffect(() => {
    async function init() {
      try {
        setError(null);
        const routeBusinessId = route?.params?.businessId as string | undefined;
        console.log('[ClassBookingScreen] Route businessId:', routeBusinessId);
        
        let profile = null;
        if (!routeBusinessId) {
          try {
            profile = await getProfile();
            console.log('[ClassBookingScreen] Profile loaded:', { hasProfile: !!profile, routeParam: routeBusinessId });
          } catch (profileError: any) {
            console.warn('[ClassBookingScreen] Failed to load profile:', profileError?.message);
            // If user not found, they may need to login
            if (profileError?.message?.includes('User not found') || profileError?.message?.includes('not found')) {
              setError('Please login to view classes. Navigate to the login screen.');
              setLoading(false);
              return;
            }
            // For other errors, continue without profile (may use route param)
          }
        }
        
        // Prefer route param; else try profile.data.business_id; else first active business from businesses[]
        let bid = routeBusinessId || profile?.data?.business_id || profile?.business_id;
        if (!bid) {
          const businesses: any[] = profile?.data?.businesses || profile?.businesses || [];
          console.log('[ClassBookingScreen] Available businesses:', businesses);
          const pick = businesses.find((b: any) => /(active|approved)/i.test(b?.membership_status || b?.status || '')) || businesses[0];
          bid = pick?.business_id || pick?.id;
        }
        
        if (!bid) {
          setError('No gym membership found. Please contact your gym administrator.');
          setLoading(false);
          return;
        }
        
        console.log('[ClassBookingScreen] Final businessId:', bid);
        setBusinessId(bid);
        
        if (bid) {
          console.log('[ClassBookingScreen] Fetching classes for businessId:', bid);
          const cls = await getClassesForBusiness(bid);
          console.log('[ClassBookingScreen] Classes response:', cls);
          
          // Backend wraps in { success, message, data: { business, classes, count } }
          const rawClasses = cls?.data?.classes || cls?.classes || cls?.data || cls || [];
          console.log('[ClassBookingScreen] Raw classes:', rawClasses);
          
          const normalized: GymClass[] = (rawClasses as any[]).map((c: any) => ({
            id: c.id || c.class_id || c.classId,
            name: c.name,
            description: c.description,
          })).filter((c: GymClass) => !!c.id && !!c.name);
          
          console.log('[ClassBookingScreen] Normalized classes:', normalized);
          setClasses(normalized);
          
          if (normalized.length === 0) {
            setError('No classes available for this gym.');
          }
        }
      } catch (e) {
        const err: any = e;
        console.error('[ClassBookingScreen] Error in init:', err);
        const errorMsg = err?.message || err?.response?.data?.message || 'Failed to load classes. Please try again.';
        setError(errorMsg);
        console.warn('Failed loading classes:', errorMsg);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Helper to get YYYY-MM-DD
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const selectedYMD = useMemo(() => ymd(selectedDate), [selectedDate]);

  // Build next 14 days date strip once
  const dateStrip: Date[] = useMemo(() => {
    const arr: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

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
            // Backend wraps in { data: { class, sessions, count } }
            const raw = res?.data?.sessions || res?.sessions || res?.data || res || [];
            const arr: Session[] = (raw as any[]).map((s: any) => ({
              id: s.id || s.session_id || s.sessionId,
              start_time: s.start_time || s.startTime,
              end_time: s.end_time || s.endTime,
              available_slots: s.available_slots ?? s.available_spots,
            })).filter((s: Session) => !!s.id && !!s.start_time);
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
        const raw = sessions?.data?.sessions || sessions?.sessions || sessions?.data || sessions || [];
        const normalized: Session[] = (raw as any[]).map((s: any) => ({
          id: s.id || s.session_id || s.sessionId,
          start_time: s.start_time || s.startTime,
          end_time: s.end_time || s.endTime,
          available_slots: s.available_slots ?? s.available_spots,
        })).filter((s: Session) => !!s.id && !!s.start_time);
        setSessionsByClass(prev => ({ ...prev, [classId]: normalized }));
      } catch (e: any) {
        if (e?.code === 401) {
          setError('Session issue detected. Please retry.');
          return;
        }
        console.warn('Failed loading sessions for class', classId, e);
      }
    }
  };

  const handleBook = async (classId: string, sessionId: string) => {
    if (!businessId) return;
    // Navigate to BookClassScreen for payment/booking confirmation
    // instead of booking directly
    navigation.navigate('BookClass', {
      businessId,
      classId,
      sessionId,
    });
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} size="large" color={theme.colors.primary} />;
  }

  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Book a Class</Text>

      {/* Error message display */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error, borderWidth: 1 }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          {error.includes('login') && (
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Login' as any)}
            >
              <Text style={styles.errorButtonText}>Go to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Only show date selector and classes if we have a businessId */}
      {!error && businessId && (
        <>
          {/* Date selector strip - Horizontal scrollable */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4 }}
          >
            {dateStrip.map((d) => {
              const isSelected = ymd(d) === selectedYMD;
              const isToday = ymd(d) === ymd(new Date());
          const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
          const monthName = d.toLocaleDateString(undefined, { month: 'short' });
          return (
            <TouchableOpacity
              key={ymd(d)}
              style={[
                styles.datePill,
                { 
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface, 
                  borderColor: isSelected ? theme.colors.primary : (isToday ? theme.colors.primary + '40' : theme.colors.border),
                  borderWidth: isToday ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedDate(d)}
              activeOpacity={0.7}
            >
              {isToday && !isSelected && (
                <View style={[styles.todayBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
              <Text style={[styles.datePillDow, { color: isSelected ? '#fff' : theme.colors.textMuted }]}>
                {dayName}
              </Text>
              <Text style={[styles.datePillDom, { 
                color: isSelected ? '#fff' : (isToday ? theme.colors.primary : theme.colors.text),
                fontWeight: isToday ? '700' : '600',
              }]}>
                {d.getDate()}
              </Text>
              <Text style={[styles.datePillMonth, { color: isSelected ? '#fff' : theme.colors.textMuted }]}>
                {monthName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Available classes for selected date - Sorted by time */}
      {(() => {
        const items: Array<{ 
          session: Session; 
          classId: string; 
          className: string;
          classDescription?: string;
        }> = [];
        
        for (const c of classes) {
          const list = sessionsByClass[c.id] || [];
          for (const s of list) {
            if ((s.start_time || '').slice(0, 10) === selectedYMD) {
              items.push({ 
                session: s, 
                classId: c.id, 
                className: c.name,
                classDescription: c.description 
              });
            }
          }
        }
        
        // Sort by start time
        items.sort((a, b) => a.session.start_time.localeCompare(b.session.start_time));
        
        if (loadingSessions && items.length === 0) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Loading classes...
              </Text>
            </View>
          );
        }
        
        if (items.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No classes available for {selectedDate.toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          );
        }
        
        return (
          <FlatList
            data={items}
            keyExtractor={(it) => it.session.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const sessionStart = new Date(item.session.start_time);
              const sessionEnd = item.session.end_time ? new Date(item.session.end_time) : null;
              const timeRange = sessionEnd 
                ? `${sessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${sessionEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : sessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <TouchableOpacity
                  style={[styles.sessionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => navigation.navigate('ClassDetails' as any, { 
                    classId: item.classId, 
                    sessionId: item.session.id, 
                    businessId 
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionContent}>
                    <View style={styles.timeSection}>
                      <Text style={[styles.sessionTime, { color: theme.colors.text }]}>
                        {timeRange}
                      </Text>
                      {item.session.available_slots !== undefined && (
                        <Text style={[styles.spotsText, { 
                          color: item.session.available_slots > 0 ? theme.colors.success : theme.colors.error 
                        }]}>
                          {item.session.available_slots > 0 
                            ? `${item.session.available_slots} spots left` 
                            : 'Full'}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.classInfo}>
                      <Text style={[styles.className, { color: theme.colors.primary }]}>
                        {item.className}
                      </Text>
                      {item.classDescription && (
                        <Text 
                          style={[styles.classDesc, { color: theme.colors.textMuted }]}
                          numberOfLines={2}
                        >
                          {item.classDescription}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.bookButton, { 
                      backgroundColor: item.session.available_slots === 0 
                        ? theme.colors.border 
                        : theme.colors.primary 
                    }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleBook(item.classId, item.session.id);
                    }}
                    disabled={item.session.available_slots === 0}
                  >
                    <Text style={[styles.bookButtonText, { 
                      color: item.session.available_slots === 0 
                        ? theme.colors.textMuted 
                        : '#fff' 
                    }]}>
                      {item.session.available_slots === 0 ? 'Full' : 'Book'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        );
      })()}
        </>
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
  emptyText: { 
    alignSelf: 'center', 
    marginVertical: 12,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
    opacity: 0.8,
  },
  className: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
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
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sessionContent: {
    flex: 1,
    marginRight: 12,
  },
  timeSection: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sessionTime: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  spotsText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  classInfo: {
    marginTop: 4,
  },
  bookButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 90,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  error: { alignSelf: 'center' },
  datePill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 70,
    position: 'relative',
  },
  todayBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  datePillDow: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  datePillDom: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 4,
  },
  datePillMonth: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  errorBanner: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
