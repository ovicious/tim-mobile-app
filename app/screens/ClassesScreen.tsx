import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { apiGet, getCurrentSubscription, getProfile } from '../api';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Badge } from '../components';
import { logger } from '../utils/logger';

interface Class {
  class_id?: string;
  id?: string;
  name: string;
  instructor_name?: string;
  start_time?: string;
  capacity?: number;
  booked?: number;
  price?: number;
  currency?: string;
}

interface Subscription {
  id: string;
  status: string;
}

type RootStackParamList = {
  NewBooking: { classId: string };
  ClassDetails: { classId: string };
  [key: string]: undefined | object;
};

export default function ClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 8,
          color: theme.colors.text,
        },
        headerSubtext: {
          fontSize: 13,
          color: theme.colors.textMuted,
        },
        listContent: {
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 20,
        },
        classCard: {
          marginBottom: 12,
        },
        classItem: {
          gap: 8,
        },
        classHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        },
        className: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
          flex: 1,
          marginRight: 8,
        },
        badgeContainer: {
          flexDirection: 'row',
          gap: 6,
        },
        classDetails: {
          gap: 6,
          marginVertical: 8,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: theme.colors.border,
        },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        detailIcon: {
          width: 20,
          textAlign: 'center',
        },
        detailText: {
          fontSize: 13,
          color: theme.colors.text,
          flex: 1,
        },
        detailTextMuted: {
          color: theme.colors.textMuted,
        },
        bookingInfo: {
          fontSize: 12,
          color: theme.colors.textMuted,
        },
        pricingRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        priceLabel: {
          fontSize: 12,
          color: theme.colors.textMuted,
        },
        price: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.primary,
        },
        freeLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.success,
        },
        bookButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          gap: 6,
          marginTop: 8,
        },
        bookButtonText: {
          color: '#fff',
          fontSize: 14,
          fontWeight: '600',
        },
        detailsButtonContainer: {
          marginTop: 8,
        },
        detailsButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 12,
          gap: 4,
        },
        detailsButtonText: {
          color: theme.colors.text,
          fontSize: 13,
          fontWeight: '500',
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyIcon: {
          fontSize: 48,
          marginBottom: 12,
        },
        emptyText: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 4,
        },
        emptySubtext: {
          fontSize: 13,
          color: theme.colors.textMuted,
        },
      }),
    [theme]
  );

  const loadClassesData = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      const bid = profile?.data?.business_id || profile?.business_id;
      setBusinessId(bid);

      // Load subscription status
      try {
        const subResponse = await getCurrentSubscription();
        setSubscription(subResponse?.data || subResponse || null);
      } catch (err) {
        logger.debug('ClassesScreen', 'No active subscription', { error: err });
        setSubscription(null);
      }

      // Load classes
      if (bid) {
        const classesResponse = await apiGet(`/api/v1/${bid}/classes`);
        const classList = classesResponse?.data || classesResponse || [];
        setClasses(classList);
        logger.debug('ClassesScreen', 'Loaded classes', { count: classList.length });
      }
    } catch (err) {
      logger.error('ClassesScreen', 'Failed to load data', { error: err });
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClassesData();
    }, [loadClassesData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClassesData();
    setRefreshing(false);
  }, [loadClassesData]);

  const hasActiveSubscription = subscription?.status === 'active';

  const renderClass = ({ item }: { item: Class }) => {
    const classId = item.class_id || item.id || '';
    const booked = item.booked || 0;
    const capacity = item.capacity || 0;
    const isAvailable = booked < capacity;
    const price = item.price || 0;
    const currency = item.currency || '€';

    return (
      <Card theme={theme} style={styles.classCard}>
        <TouchableOpacity activeOpacity={0.7}>
          <View style={styles.classItem}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{item.name}</Text>
              <View style={styles.badgeContainer}>
                {!hasActiveSubscription && price > 0 && (
                  <Badge
                    theme={theme}
                    text={`${currency}${Math.round(price)}`}
                    variant="warning"
                  />
                )}
                <Badge
                  theme={theme}
                  text={isAvailable ? 'Available' : 'Full'}
                  variant={isAvailable ? 'success' : 'error'}
                />
              </View>
            </View>

            <View style={styles.classDetails}>
              {item.instructor_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👤</Text>
                  <Text style={styles.detailText}>{item.instructor_name}</Text>
                </View>
              )}

              {item.start_time && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🕐</Text>
                  <Text style={styles.detailText}>
                    {new Date(item.start_time).toLocaleString()}
                  </Text>
                </View>
              )}

              {item.capacity && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👥</Text>
                  <Text style={[styles.detailText, styles.detailTextMuted]}>
                    {booked}/{capacity} booked
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.pricingRow}>
              {hasActiveSubscription ? (
                <Text style={styles.freeLabel}>✓ Included in your plan</Text>
              ) : price > 0 ? (
                <View>
                  <Text style={styles.priceLabel}>Pay per class</Text>
                  <Text style={styles.price}>{currency}{Math.round(price)}</Text>
                </View>
              ) : (
                <Text style={styles.freeLabel}>Free</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('NewBooking' as any, { classId })}
              disabled={!isAvailable}
            >
              <MaterialIcons name="event-note" size={18} color="#fff" />
              <Text style={styles.bookButtonText}>
                {isAvailable ? 'Book Class' : 'Fully Booked'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsButtonContainer}
              onPress={() => navigation.navigate('ClassDetails' as any, { classId })}
            >
              <View style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>View Details</Text>
                <MaterialIcons name="chevron-right" size={16} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (classes.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No Classes Available</Text>
        <Text style={styles.emptySubtext}>Check back soon for new classes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Classes</Text>
        <Text style={styles.headerSubtext}>
          {hasActiveSubscription
            ? '✓ All classes included with your subscription'
            : 'Book individual classes or subscribe for unlimited access'}
        </Text>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.class_id || item.id || Math.random().toString()}
        renderItem={renderClass}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}
