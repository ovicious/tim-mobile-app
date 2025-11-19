import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { getClassDetails, getCurrentSubscription, getProfile, getBusinessPricing } from '../api';
import { logger } from '../utils/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ClassDetail {
  id: string;
  class_id: string;
  name: string;
  description?: string;
  instructor_name: string;
  instructor_bio?: string;
  instructor_image?: string;
  level?: string;
  duration?: number;
  capacity: number;
  booked: number;
  price?: number;
  currency?: string;
  start_time: string;
  end_time?: string;
  gym_name?: string;
  gym_logo?: string;
  session_id?: string;
  requirements?: string[];
  benefits?: string[];
}

type RootStackParamList = {
  Classes: undefined;
  NewBooking: { classId: string };
  [key: string]: undefined | object;
};

export default function ClassDetailsScreen({ route }: any) {
  const { classId, sessionId, businessId: routeBusinessId } = route.params || {};
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [pricing, setPricing] = useState<{ booking_base_eur?: number; guest_eur?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        backButton: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        backButtonText: {
          fontSize: 16,
          color: theme.colors.primary,
          fontWeight: '500',
          marginLeft: 4,
        },
        scrollContent: {
          paddingHorizontal: 16,
          paddingVertical: 20,
          paddingBottom: 32,
        },
        classNameSection: {
          marginBottom: 16,
        },
        className: {
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 4,
        },
        classLevel: {
          fontSize: 12,
          backgroundColor: theme.colors.primary + '20',
          color: theme.colors.primary,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          alignSelf: 'flex-start',
          overflow: 'hidden',
        },
        infoCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        },
        cardTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 12,
        },
        infoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
          gap: 12,
        },
        infoRowLast: {
          marginBottom: 0,
        },
        infoIcon: {
          fontSize: 20,
          minWidth: 24,
          textAlign: 'center',
        },
        infoLabel: {
          fontSize: 12,
          color: theme.colors.textMuted,
          width: 80,
        },
        infoValue: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          flex: 1,
        },
        instructorCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          alignItems: 'center',
        },
        instructorImage: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.primary + '30',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        },
        instructorName: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 4,
        },
        instructorBio: {
          fontSize: 13,
          color: theme.colors.textMuted,
          textAlign: 'center',
          lineHeight: 18,
        },
        descriptionSection: {
          marginBottom: 16,
        },
        sectionTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 8,
        },
        descriptionText: {
          fontSize: 13,
          color: theme.colors.text,
          lineHeight: 20,
        },
        listSection: {
          marginBottom: 16,
        },
        listItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 8,
          gap: 8,
        },
        listItemLast: {
          marginBottom: 0,
        },
        listItemIcon: {
          marginTop: 2,
        },
        listItemText: {
          flex: 1,
          fontSize: 13,
          color: theme.colors.text,
          lineHeight: 18,
        },
        priceSection: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        priceLabel: {
          fontSize: 12,
          color: theme.colors.textMuted,
        },
        price: {
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        freeLabel: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.success,
        },
        actionButton: {
          marginTop: 8,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 64,
        },
        emptyIcon: {
          fontSize: 48,
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
        },
        capacityBar: {
          height: 6,
          backgroundColor: theme.colors.border,
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 4,
        },
        capacityFill: {
          height: '100%',
          backgroundColor: theme.colors.warning,
          borderRadius: 3,
        },
      }),
    [theme, insets]
  );

  const loadClassDetails = useCallback(async () => {
    try {
      setLoading(true);
      logger.debug('ClassDetailsScreen', 'Loading class details', { classId, sessionId, routeBusinessId });

      // Derive businessId from route param or profile to satisfy API shape /{business_id}/classes/{class_id}
      let bid = routeBusinessId;
      if (!bid) {
        const profile = await getProfile();
        bid = profile?.data?.business_id || profile?.business_id;
      }

      if (!bid) {
        throw new Error('Business ID not found');
      }

      logger.debug('ClassDetailsScreen', 'Using business ID', { bid });

      const [classRes, subRes, pricingRes] = await Promise.all([
        getClassDetails(bid, classId),
        getCurrentSubscription(),
        getBusinessPricing(bid),
      ]);

      const classData = classRes?.data || classRes;
      logger.debug('ClassDetailsScreen', 'Received class data', { 
        hasClassData: !!classData,
        hasUpcomingSessions: !!(classData?.upcoming_sessions),
        sessionCount: classData?.upcoming_sessions?.length || 0
      });

      if (classData) {
        // If a specific session is requested, find it in the upcoming sessions
        if (sessionId && classData.upcoming_sessions) {
          const session = classData.upcoming_sessions.find((s: any) => 
            String(s.session_id) === String(sessionId)
          );
          if (session) {
            // Merge session-specific data with class data
            setClassDetail({
              ...classData,
              session_id: sessionId,
              start_time: session.start_time,
              end_time: session.end_time,
              booked: session.booked_count || session.booked || 0,
              capacity: session.max_capacity || session.capacity || classData.capacity,
              available_spots: session.available_spots || (session.max_capacity - (session.booked_count || 0)),
            });
            logger.debug('ClassDetailsScreen', 'Successfully loaded session-specific data', { sessionId });
          } else {
            logger.warn('ClassDetailsScreen', 'Session not found in upcoming_sessions, showing class info only', { 
              sessionId, 
              availableSessionIds: classData.upcoming_sessions?.map((s: any) => s.session_id) 
            });
            // Session not found, show general class info but keep session ID for reference
            setClassDetail({
              ...classData,
              session_id: sessionId,
            });
          }
        } else if (sessionId) {
          logger.warn('ClassDetailsScreen', 'Session requested but no upcoming_sessions in response', { 
            sessionId, 
            hasClassData: !!classData,
            classDataKeys: Object.keys(classData)
          });
          // Session requested but no upcoming sessions data, show general class info
          setClassDetail({
            ...classData,
            session_id: sessionId,
          });
        } else {
          setClassDetail(classData);
        }
      }

      setSubscription(subRes?.data || subRes || null);
      setPricing(pricingRes?.data || pricingRes || null);
      logger.debug('ClassDetailsScreen', 'Loaded class details successfully');
    } catch (err: any) {
      logger.error('ClassDetailsScreen', 'Failed to load details', { error: err, classId, sessionId });
      Alert.alert('Error', 'Unable to load class details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [classId, sessionId, routeBusinessId]);

  useEffect(() => {
    loadClassDetails();
  }, [loadClassDetails]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const availableSeats = (classDetail?.capacity || 0) - (classDetail?.booked || 0);
  const capacityPercent = classDetail ? (classDetail.booked / classDetail.capacity) * 100 : 0;
  // Price resolved from class detail or business pricing; default to €25
  const effectivePrice = classDetail?.price ?? pricing?.booking_base_eur ?? 25;
  const hasActiveSubscription = subscription?.status === 'active';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!classDetail) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-left" size={24} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.container, styles.emptyState]}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Class Not Found</Text>
          <Text style={styles.emptySubtext}>Unable to load class details</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="chevron-left" size={24} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.classNameSection}>
          <Text style={styles.className}>{classDetail.name}</Text>
          {classDetail.level && <Text style={styles.classLevel}>{classDetail.level} Level</Text>}
        </View>

        {/* Gym & Basic Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Class Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏢</Text>
            <Text style={styles.infoLabel}>Gym</Text>
            <Text style={styles.infoValue}>{classDetail.gym_name || 'Your Gym'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{classDetail.duration || 60} minutes</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{formatDate(classDetail.start_time)}</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoLabel}>Capacity</Text>
            <Text style={styles.infoValue}>
              {classDetail.booked}/{classDetail.capacity}
            </Text>
          </View>

          <View style={styles.capacityBar}>
            <View style={[styles.capacityFill, { width: `${Math.min(capacityPercent, 100)}%` }]} />
          </View>
        </View>

        {/* Instructor */}
        <View style={styles.instructorCard}>
          <View style={styles.instructorImage}>
            <MaterialIcons name="person" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.instructorName}>{classDetail.instructor_name}</Text>
          {classDetail.instructor_bio && <Text style={styles.instructorBio}>{classDetail.instructor_bio}</Text>}
        </View>

        {/* Description */}
        {classDetail.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Class</Text>
            <Text style={styles.descriptionText}>{classDetail.description}</Text>
          </View>
        )}

        {/* Benefits */}
        {classDetail.benefits && classDetail.benefits.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>✓ Benefits</Text>
            {classDetail.benefits.map((benefit, index) => (
              <View
                key={index}
                style={[styles.listItem, index === classDetail.benefits!.length - 1 && styles.listItemLast]}
              >
                <View style={styles.listItemIcon}>
                  <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
                </View>
                <Text style={styles.listItemText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Requirements */}
        {classDetail.requirements && classDetail.requirements.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>📋 Requirements</Text>
            {classDetail.requirements.map((req, index) => (
              <View
                key={index}
                style={[styles.listItem, index === classDetail.requirements!.length - 1 && styles.listItemLast]}
              >
                <View style={styles.listItemIcon}>
                  <MaterialIcons name="info" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.listItemText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pricing */}
        {!hasActiveSubscription ? (
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Price per session</Text>
              <Text style={styles.price}>
                {classDetail?.currency || '€'}{Math.round(effectivePrice)}
              </Text>
            </View>
            <Text style={styles.priceLabel}>Pay as you go</Text>
          </View>
        ) : (
          <View style={styles.priceSection}>
            <Text style={styles.freeLabel}>✓ Included with your subscription</Text>
          </View>
        )}

        {/* Guests Info */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Guests</Text>
          <Text style={styles.price}>€20 each</Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionButton}>
          <Button
            theme={theme}
            onPress={() => navigation.navigate('NewBooking' as any, { classId })}
            title={availableSeats > 0 ? 'Book Class' : 'Class Full'}
            variant={availableSeats > 0 ? 'primary' : 'secondary'}
            disabled={availableSeats <= 0}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
