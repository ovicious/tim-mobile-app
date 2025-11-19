import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, getMyBookings, cancelBooking } from '../api';
import { useThemeColors } from '../theme';

// Enhanced booking type matching backend response
type Booking = {
  session_id: string;
  status: string;
  booked_at: string;
  class: {
    class_id: string;
    name: string;
    duration: number;
    price: number;
  };
  session: {
    start_time: string;
    end_time: string;
    available_spots: number;
    trainers: string[];
  };
  can_cancel: boolean;
};

type MonthSection = {
  month: string;
  data: Booking[];
};


export default function MyBookingsScreen() {
  const { theme } = useThemeColors();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile();
        const bid = profile?.data?.business_id || profile?.business_id;
        setBusinessId(bid);
        
        // Extract business name from profile
        const businesses = profile?.data?.businesses || profile?.businesses || [];
        if (businesses.length > 0) {
          const currentBusiness = businesses.find((b: any) => b.business_id === bid);
          setBusinessName(currentBusiness?.name || '');
        }
        
        if (bid) {
          const res = await getMyBookings(bid);
          setBookings(Array.isArray(res) ? res : []);
        }
      } catch (e) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const onCancel = (booking: Booking) => {
    if (!businessId) return;
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          setWorking(booking.session_id);
          try {
            await cancelBooking(businessId, booking.class.class_id, booking.session_id);
            setBookings(prev => prev.filter(b => b.session_id !== booking.session_id));
            Alert.alert('Success', 'Booking cancelled successfully');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to cancel booking');
          } finally {
            setWorking(null);
          }
        },
      },
    ]);
  };

  // Group bookings by month
  const groupedBookings = useMemo(() => {
    const now = new Date();
    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    bookings.forEach(b => {
      const startTime = new Date(b.session.start_time);
      if (b.status === 'cancelled') return; // Skip cancelled
      if (startTime > now && b.status === 'confirmed') {
        upcoming.push(b);
      } else if (startTime <= now || b.status === 'attended' || b.status === 'no_show') {
        past.push(b);
      }
    });

    // Sort upcoming by soonest first
    upcoming.sort((a, b) => 
      new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime()
    );

    // Sort past by newest first
    past.sort((a, b) => 
      new Date(b.session.start_time).getTime() - new Date(a.session.start_time).getTime()
    );

    // Group by month
    const groupByMonth = (bookings: Booking[]): MonthSection[] => {
      const groups = new Map<string, Booking[]>();
      
      bookings.forEach(booking => {
        const date = new Date(booking.session.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!groups.has(monthKey)) {
          groups.set(monthKey, []);
        }
        groups.get(monthKey)!.push(booking);
      });

      return Array.from(groups.entries()).map(([month, data]) => ({
        month,
        data,
      }));
    };

    return {
      upcoming: groupByMonth(upcoming),
      past: groupByMonth(past),
    };
  }, [bookings]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderBookingCard = (booking: Booking) => {
    const isUpcoming = tab === 'upcoming';
    const startDate = new Date(booking.session.start_time);
    const today = new Date();
    const isToday = startDate.toDateString() === today.toDateString();

    return (
      <View 
        key={booking.session_id} 
        style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            shadowColor: '#000',
          }
        ]}
      >
        {/* Class Name */}
        <View style={styles.cardHeader}>
          <Text style={[styles.className, { color: theme.colors.primary }]}>
            {booking.class.name}
          </Text>
          {isToday && isUpcoming && (
            <View style={[styles.todayBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.todayText}>TODAY</Text>
            </View>
          )}
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />

        {/* Date & Time */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {formatDate(booking.session.start_time)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {formatTime(booking.session.start_time)} - {formatTime(booking.session.end_time)}
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.infoRow}>
          <Ionicons name="hourglass-outline" size={16} color={theme.colors.textMuted} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {booking.class.duration} min
          </Text>
        </View>

        {/* Venue */}
        {businessName && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {businessName}
            </Text>
          </View>
        )}

        {/* Status Badge or Cancel Button */}
        {isUpcoming ? (
          booking.can_cancel && (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.error }]}
              onPress={() => onCancel(booking)}
              disabled={working === booking.session_id}
            >
              <Text style={styles.cancelButtonText}>
                {working === booking.session_id ? 'Cancelling...' : 'Cancel Booking'}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.statusRow}>
            <View 
              style={[
                styles.statusBadge, 
                { 
                  backgroundColor: booking.status === 'attended' 
                    ? 'rgba(22, 163, 74, 0.1)' 
                    : 'rgba(220, 38, 38, 0.1)' 
                }
              ]}
            >
              <Ionicons 
                name={booking.status === 'attended' ? 'checkmark-circle' : 'close-circle'} 
                size={18} 
                color={booking.status === 'attended' ? '#16A34A' : '#DC2626'} 
              />
              <Text 
                style={[
                  styles.statusText, 
                  { color: booking.status === 'attended' ? '#16A34A' : '#DC2626' }
                ]}
              >
                {booking.status === 'attended' ? 'Attended' : 'Missed'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const sections = tab === 'upcoming' ? groupedBookings.upcoming : groupedBookings.past;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>My Bookings</Text>
      
      {/* Tab Selector */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {(['upcoming', 'past'] as const).map(tabKey => (
          <TouchableOpacity
            key={tabKey}
            style={[
              styles.tab,
              tab === tabKey && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setTab(tabKey)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === tabKey ? '#fff' : theme.colors.text }
              ]}
            >
              {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.session_id}
        renderSectionHeader={({ section }) => (
          <View style={[styles.monthHeader, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.monthText, { color: theme.colors.primary }]}>
              {section.month}
            </Text>
          </View>
        )}
        renderItem={({ item }) => renderBookingCard(item)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={64} 
              color={theme.colors.textMuted} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No {tab} bookings
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  monthHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 17,
    fontWeight: '700',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  statusRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

