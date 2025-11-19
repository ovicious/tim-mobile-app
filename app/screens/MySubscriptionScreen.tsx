import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { getCurrentSubscription, cancelSubscription, pauseSubscription } from '../api';
import { logger } from '../utils/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CurrentSubscription {
  id: string;
  plan_type: string;
  plan_name?: string;
  status: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  start_date: string;
  next_billing_at: string;
  end_date?: string;
  auto_renew: boolean;
  features?: string[];
}

type RootStackParamList = {
  Dashboard: undefined;
  Subscriptions: undefined;
  [key: string]: undefined | object;
};

export default function MySubscriptionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [pausing, setPausing] = useState(false);

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
          paddingBottom: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        backButton: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        backButtonText: {
          fontSize: 16,
          color: theme.colors.primary,
          fontWeight: '500',
          marginLeft: 4,
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 4,
        },
        contentContainer: {
          padding: 16,
          paddingBottom: 40,
        },
        statusBadge: {
          alignSelf: 'flex-start',
          backgroundColor: theme.colors.success + '20',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          marginBottom: 16,
        },
        statusText: {
          color: theme.colors.success,
          fontSize: 12,
          fontWeight: '600',
        },
        planCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        },
        planName: {
          fontSize: 22,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 4,
        },
        planType: {
          fontSize: 12,
          color: theme.colors.textMuted,
          marginBottom: 12,
        },
        priceSection: {
          paddingVertical: 16,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 12,
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        priceLabel: {
          fontSize: 13,
          color: theme.colors.textMuted,
        },
        priceValue: {
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        currency: {
          fontSize: 14,
          color: theme.colors.textMuted,
          marginRight: 4,
        },
        billingInfo: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        billingLabel: {
          fontSize: 13,
          color: theme.colors.textMuted,
        },
        billingValue: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.text,
        },
        detailsSection: {
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        },
        detailsTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 12,
        },
        detailRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        detailRowLast: {
          borderBottomWidth: 0,
        },
        detailLabel: {
          fontSize: 13,
          color: theme.colors.textMuted,
        },
        detailValue: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.text,
        },
        upcomingBillingCard: {
          backgroundColor: theme.colors.warning + '15',
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.warning,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        upcomingIcon: {
          fontSize: 24,
        },
        upcomingContent: {
          flex: 1,
        },
        upcomingLabel: {
          fontSize: 12,
          color: theme.colors.textMuted,
          marginBottom: 2,
        },
        upcomingDate: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
        },
        featuresList: {
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        },
        featureItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 8,
        },
        featureItemLast: {
          marginBottom: 0,
        },
        featureIcon: {
          marginTop: 2,
        },
        featureText: {
          flex: 1,
          fontSize: 13,
          color: theme.colors.text,
          lineHeight: 18,
        },
        actionButtons: {
          gap: 12,
          marginTop: 8,
        },
        actionButtonSecondary: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        },
        dangerButton: {
          backgroundColor: theme.colors.error,
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
          textAlign: 'center',
          marginBottom: 20,
          maxWidth: 280,
        },
        renewalToggle: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        renewalLabel: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.text,
        },
        renewalBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: theme.colors.success + '20',
        },
        renewalBadgeText: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.colors.success,
        },
      }),
    [theme, insets]
  );

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCurrentSubscription();
      const subData = response?.data || response;

      if (subData && subData.id) {
        setSubscription(subData);
        logger.debug('MySubscriptionScreen', 'Loaded subscription', { planType: subData.plan_type });
      } else {
        setSubscription(null);
      }
    } catch (err) {
      logger.debug('MySubscriptionScreen', 'No active subscription', { error: err });
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [loadSubscription])
  );

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const daysUntilBilling = (dateString: string): number => {
    try {
      const billingDate = new Date(dateString);
      const today = new Date();
      const diffTime = billingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription?',
      'Your access will end at the end of your billing period. You can resubscribe anytime.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!subscription) return;
            try {
              setCancelling(true);
              await cancelSubscription(subscription.id);
              Alert.alert('Success', 'Your subscription has been cancelled.');
              navigation.goBack();
            } catch (err) {
              logger.error('MySubscriptionScreen', 'Failed to cancel subscription', { error: err });
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handlePause = () => {
    Alert.alert(
      'Pause Subscription?',
      'You can resume your subscription anytime.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Pause',
          onPress: async () => {
            if (!subscription) return;
            try {
              setPausing(true);
              await pauseSubscription(subscription.id);
              Alert.alert('Success', 'Your subscription has been paused.');
              loadSubscription();
            } catch (err) {
              logger.error('MySubscriptionScreen', 'Failed to pause subscription', { error: err });
              Alert.alert('Error', 'Failed to pause subscription. Please try again.');
            } finally {
              setPausing(false);
            }
          },
        },
      ]
    );
  };

  const handleViewTerms = async () => {
    try {
      await Linking.openURL('https://tim.app/terms');
    } catch (err) {
      logger.error('MySubscriptionScreen', 'Failed to open terms', { error: err });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!subscription) {
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
          <Text style={styles.headerTitle}>My Subscription</Text>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Active Subscription</Text>
            <Text style={styles.emptySubtext}>
              Subscribe to unlock unlimited class access or pay per class.
            </Text>
            <Button
              theme={theme}
              onPress={() => navigation.navigate('Subscriptions')}
              title="Browse Plans"
              variant="primary"
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  const daysRemaining = daysUntilBilling(subscription.next_billing_at);

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
        <Text style={styles.headerTitle}>My Subscription</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>✓ ACTIVE</Text>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planName}>{subscription.plan_name || subscription.plan_type}</Text>
          <Text style={styles.planType}>{subscription.plan_type}</Text>

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Monthly Rate</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.currency}>{subscription.currency}</Text>
                <Text style={styles.priceValue}>{Math.round(subscription.amount)}</Text>
              </View>
            </View>

            <View style={styles.billingInfo}>
              <Text style={styles.billingLabel}>Billing Cycle</Text>
              <Text style={styles.billingValue}>{subscription.billing_cycle}</Text>
            </View>
          </View>

          <View style={styles.renewalToggle}>
            <Text style={styles.renewalLabel}>Auto-Renewal</Text>
            <View style={styles.renewalBadge}>
              <Text style={styles.renewalBadgeText}>{subscription.auto_renew ? 'ENABLED' : 'DISABLED'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.upcomingBillingCard}>
          <Text style={styles.upcomingIcon}>📅</Text>
          <View style={styles.upcomingContent}>
            <Text style={styles.upcomingLabel}>Next Billing</Text>
            <Text style={styles.upcomingDate}>
              {formatDate(subscription.next_billing_at)} ({daysRemaining} days)
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Subscription Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started</Text>
            <Text style={styles.detailValue}>{formatDate(subscription.start_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Next Billing</Text>
            <Text style={styles.detailValue}>{formatDate(subscription.next_billing_at)}</Text>
          </View>

          {subscription.end_date && (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={styles.detailValue}>{formatDate(subscription.end_date)}</Text>
            </View>
          )}
        </View>

        {subscription.features && subscription.features.length > 0 && (
          <View style={styles.featuresList}>
            <Text style={styles.detailsTitle}>What's Included</Text>
            {subscription.features.map((feature, index) => (
              <View
                key={index}
                style={[styles.featureItem, index === subscription.features!.length - 1 && styles.featureItemLast]}
              >
                <View style={styles.featureIcon}>
                  <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            theme={theme}
            onPress={() => navigation.navigate('Subscriptions')}
            title="Change Plan"
            variant="secondary"
            fullWidth
          />

          <Button
            theme={theme}
            onPress={handlePause}
            title={pausing ? 'Pausing...' : 'Pause Subscription'}
            variant="secondary"
            disabled={pausing || cancelling}
            fullWidth
          />

          <Button
            theme={theme}
            onPress={handleCancel}
            title={cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            variant="danger"
            disabled={cancelling || pausing}
            fullWidth
          />
        </View>

        <TouchableOpacity onPress={handleViewTerms} style={{ marginTop: 16, paddingVertical: 8 }}>
          <Text style={{ color: theme.colors.primary, fontSize: 13, textAlign: 'center' }}>
            View Subscription Terms →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
