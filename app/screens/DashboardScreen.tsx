import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button, Badge } from '../components';
import { ProfileCompletionCard, NextClassCard, GymInfoCard, ProfileQuickAccessCard, TopBanner, ShopSection } from '../components/dashboard';
import { apiGet, getProfile, getMyBookings } from '../api';
import { logger } from '../utils/logger';
import { getGymName } from '../utils/gymUtils';
import { getBusiness } from '../api/business';

interface UpcomingBooking {
  id: string;
  class_id: string;
  class_name?: string;
  start_time?: string;
  instructor_name?: string;
  class_duration?: number;
}

interface Subscription {
  plan_type: string;
  status: string;
  next_billing_at?: string;
  end_date?: string;
  amount?: number;
}

interface UserProfile {
  first_name?: string;
  firstName?: string;
  business_name?: string;
  businessName?: string;
  approval_status?: string;
  approvalStatus?: string;
}

type RootStackParamList = {
  Classes: undefined;
  MySubscription: undefined;
  Subscriptions: undefined;
  Profile: undefined;
  MyBookings: undefined;
  [key: string]: undefined | object;
};

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<any | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scrollContent: {
          padding: 16,
          paddingBottom: 32,
        },
        header: {
          marginBottom: 24,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        notifBtn: {
          padding: 6,
          marginLeft: 8,
        },
        greeting: {
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 4,
        },
        subtext: {
          fontSize: 14,
          color: theme.colors.textMuted,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 12,
          marginTop: 20,
        },
        subscriptionCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        },
        subscriptionStatus: {
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.textMuted,
          marginBottom: 8,
        },
        subscriptionPlan: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 8,
        },
        subscriptionDetails: {
          fontSize: 12,
          color: theme.colors.textMuted,
          marginBottom: 12,
        },
        buttonRow: {
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
        },
        quickActionBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 12,
          gap: 6,
        },
        quickActionBtnSecondary: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        quickActionText: {
          color: '#fff',
          fontSize: 12,
          fontWeight: '600',
        },
        quickActionTextSecondary: {
          color: theme.colors.primary,
        },
        bookingItem: {
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.warning,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        bookingInfo: {
          flex: 1,
        },
        bookingClass: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 4,
        },
        bookingTime: {
          fontSize: 12,
          color: theme.colors.textMuted,
        },
        noBookings: {
          textAlign: 'center',
          color: theme.colors.textMuted,
          fontSize: 14,
          paddingVertical: 24,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 32,
        },
        emptyIcon: {
          marginBottom: 12,
        },
        emptyTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 4,
        },
        emptySubtext: {
          fontSize: 13,
          color: theme.colors.textMuted,
          marginBottom: 16,
        },
        errorBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          marginBottom: 16,
          gap: 8,
        },
        errorBannerText: {
          color: '#fff',
          fontSize: 13,
          fontWeight: '500',
          flex: 1,
        },
      }),
    [theme]
  );

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getProfile();
      const prof = profile?.data ?? profile ?? null;

      // Extract first name
      const fname = prof?.first_name || prof?.firstName || '';
      setFirstName(fname);
      setProfileData(prof);
      
      const bid = prof?.business_id;
      setBusinessId(bid);

      if (bid) {
        // Load business data for short name display
        try {
          const business = await getBusiness(bid);
          setBusinessData(business);
        } catch (err: any) {
          logger.warn('DashboardScreen', 'Failed to load business data', { error: err });
          // Don't set error for business data failure - it's not critical
        }

        // Load subscription
        try {
          const subResponse = await apiGet('/api/v1/subscriptions/me');
          setSubscription(subResponse?.data || null);
        } catch (err: any) {
          // Subscription endpoint not yet implemented on backend
          logger.debug('DashboardScreen', 'Subscription endpoint unavailable', { error: err });
          setSubscription(null);
        }

        // Load upcoming bookings
        try {
          const bookings = await getMyBookings(bid);
          setUpcomingBookings(Array.isArray(bookings) ? bookings.slice(0, 3) : []);
        } catch (err: any) {
          logger.warn('DashboardScreen', 'Failed to load bookings', { error: err });
          setError('Could not load upcoming bookings');
          setUpcomingBookings([]);
        }
      }
    } catch (err: any) {
      logger.error('DashboardScreen', 'Failed to load dashboard data', { error: err });
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error }]}>
          <MaterialIcons name="error-outline" size={20} color="#fff" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Header + Banner */}
      <View style={[styles.header]}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <TopBanner theme={theme} shortName={businessData?.shortName} />
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications' as any)}
            style={styles.notifBtn}
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="notifications-none" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>
          Welcome Back{firstName ? `, ${firstName}` : ''}! 👋
        </Text>
        <Text style={styles.subtext}>Your fitness journey awaits</Text>
      </View>

      {/* Profile Completion */}
      <ProfileCompletionCard
        theme={theme}
        profile={profileData}
        onCompletePress={() => navigation.navigate('EditProfile')}
      />

      {/* Gym Info */}
      <GymInfoCard
        theme={theme}
        gym={{
          name: getGymName(profileData),
          address: profileData?.businesses?.[0]?.address,
        }}
        onPressClasses={() => navigation.navigate('ClassBooking' as any)}
      />

      {/* Profile Quick Access */}
      <ProfileQuickAccessCard
        theme={theme}
        profile={profileData}
        onPressEdit={() => navigation.navigate('EditProfile')}
      />

      {/* Subscription Status Card */}
      <Text style={styles.sectionTitle}>📋 Subscription Status</Text>
      {subscription ? (
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionStatus}>Active Subscription</Text>
          <Text style={styles.subscriptionPlan}>{subscription.plan_type}</Text>
          {subscription.next_billing_at && (
            <Text style={styles.subscriptionDetails}>
              Next billing: {formatDate(subscription.next_billing_at)}
            </Text>
          )}
          {subscription.end_date && (
            <Text style={styles.subscriptionDetails}>Expires: {formatDate(subscription.end_date)}</Text>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('MySubscription')}
            style={styles.buttonRow}
          >
            <View style={[styles.quickActionBtn, styles.quickActionBtnSecondary]}>
              <MaterialIcons name="manage-accounts" size={16} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>Manage</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionStatus}>No Active Subscription</Text>
          <Text style={styles.subscriptionDetails}>
            Subscriptions coming soon. Book individual classes anytime!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Classes')}
            style={styles.buttonRow}
          >
            <View style={styles.quickActionBtn}>
              <MaterialIcons name="event-note" size={16} color="#fff" />
              <Text style={styles.quickActionText}>Browse Classes</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ClassBooking' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.quickActionBtn}>
            <MaterialIcons name="event-note" size={16} color="#fff" />
            <Text style={styles.quickActionText}>New Booking</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyBookings')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionBtn, styles.quickActionBtnSecondary]}>
            <MaterialIcons name="calendar-today" size={16} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>My Booking</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Next Class */}
      <NextClassCard
        theme={theme}
        nextClass={upcomingBookings.length > 0 ? upcomingBookings[0] : null}
        onPressView={() => navigation.navigate('MyBookings')}
      />

      {/* Upcoming Bookings */}
      <Text style={styles.sectionTitle}>🗓️ Upcoming Bookings</Text>
      {upcomingBookings.length > 0 ? (
        <>
          {upcomingBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingClass}>{booking.class_name || 'Class'}</Text>
                <Text style={styles.bookingTime}>
                  {booking.instructor_name ? `with ${booking.instructor_name} • ` : ''}
                  {formatDate(booking.start_time)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
            </View>
          ))}
          <TouchableOpacity
            onPress={() => navigation.navigate('MyBookings')}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '500' }}>
              View all bookings →
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Upcoming Bookings</Text>
          <Text style={styles.emptySubtext}>Schedule your first class today</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Classes')}
            style={styles.quickActionBtn}
          >
            <MaterialIcons name="event-note" size={16} color="#fff" />
            <Text style={styles.quickActionText}>Browse Classes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Shop Section */}
      <ShopSection
        theme={theme}
        onPressMembership={() => navigation.navigate('Subscriptions' as any)}
        onPressVouchers={() => navigation.navigate('Vouchers' as any)}
        onPressTickets={() => navigation.navigate('Tickets' as any)}
        onPressCredit={() => navigation.navigate('Credit' as any)}
      />
    </ScrollView>
  );
}
