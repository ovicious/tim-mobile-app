import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { getProfile, getSubscriptionPlans, createSubscription } from '../api';
import { logger } from '../utils/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SubscriptionPlan {
  id: string;
  plan_type: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  highlight?: boolean;
}

type RootStackParamList = {
  Dashboard: undefined;
  MySubscription: undefined;
  [key: string]: undefined | object;
};

export default function SubscriptionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

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
        headerSubtext: {
          fontSize: 13,
          color: theme.colors.textMuted,
        },
        contentContainer: {
          paddingHorizontal: 16,
          paddingVertical: 20,
          paddingBottom: 40,
        },
        planCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: theme.colors.border,
        },
        planCardHighlight: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary + '08',
        },
        planBadge: {
          position: 'absolute',
          top: -8,
          right: 16,
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
        },
        planBadgeText: {
          color: '#fff',
          fontSize: 11,
          fontWeight: '600',
        },
        planHeader: {
          marginBottom: 12,
        },
        planName: {
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 4,
        },
        planDescription: {
          fontSize: 12,
          color: theme.colors.textMuted,
          marginBottom: 8,
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          marginTop: 8,
        },
        price: {
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginRight: 4,
        },
        currency: {
          fontSize: 16,
          color: theme.colors.textMuted,
        },
        billingCycle: {
          fontSize: 12,
          color: theme.colors.textMuted,
          marginLeft: 4,
        },
        featuresList: {
          marginVertical: 16,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        featureItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 8,
          gap: 8,
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
        selectButton: {
          marginTop: 12,
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
          maxWidth: 300,
        },
      }),
    [theme, insets]
  );

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      const bid = profile?.data?.business_id || profile?.business_id;
      setBusinessId(bid);

      if (bid) {
        const plansResponse = await getSubscriptionPlans(bid);
        const plansData = plansResponse?.data || plansResponse || [];
        setPlans(plansData);
        logger.debug('SubscriptionsScreen', 'Loaded subscription plans', { count: plansData.length });
      }
    } catch (err) {
      logger.error('SubscriptionsScreen', 'Failed to load plans', { error: err });
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  }, [loadPlans]);

  const handleSubscribe = useCallback(
    async (plan: SubscriptionPlan) => {
      if (!businessId) return;

      try {
        setSubscribing(plan.id);
        logger.debug('SubscriptionsScreen', 'Starting subscription flow', { planType: plan.plan_type });

        // For MVP, we'll initiate subscription
        // Full payment flow will be integrated in next phase
        const response = await createSubscription(plan.plan_type, businessId);

        if (response?.status === 'success' || response?.data) {
          logger.debug('SubscriptionsScreen', 'Subscription created', { planType: plan.plan_type });
          Alert.alert('Success', 'Subscription activated! 🎉', [
            {
              text: 'View Details',
              onPress: () => navigation.navigate('MySubscription'),
            },
            { text: 'Done', onPress: () => navigation.goBack() },
          ]);
        } else {
          throw new Error(response?.message || 'Failed to create subscription');
        }
      } catch (err: any) {
        logger.error('SubscriptionsScreen', 'Failed to subscribe', { error: err });
        const errorMessage = err?.message || 'Failed to create subscription. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setSubscribing(null);
      }
    },
    [businessId, navigation]
  );

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <View key={plan.id} style={[styles.planCard, plan.highlight && styles.planCardHighlight]}>
      {plan.highlight && (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>RECOMMENDED</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>{plan.currency}</Text>
          <Text style={styles.price}>{Math.round(plan.price)}</Text>
          <Text style={styles.billingCycle}>/{plan.billing_cycle}</Text>
        </View>
      </View>

      <View style={styles.featuresList}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.selectButton}>
        <Button
          theme={theme}
          onPress={() => handleSubscribe(plan)}
          title="Select Plan"
          variant="primary"
          disabled={subscribing === plan.id}
          loading={subscribing === plan.id}
          fullWidth
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <Text style={styles.headerSubtext}>Choose a plan that fits your fitness goals</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {plans.length > 0 ? (
          plans.map((plan) => renderPlanCard(plan))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Plans Available</Text>
            <Text style={styles.emptySubtext}>
              Subscription plans are not currently available for your gym.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
