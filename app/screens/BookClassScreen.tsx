/**
 * BookClassScreen - Pay-Per-Class Booking
 *
 * Implements SRD §3.3 (Pay-Per-Class Booking) & §3.6.1 (Booking Workflow)
 *
 * Features:
 * - Display class & session details
 * - Check subscription status (free if active, €20 if not)
 * - Payment method selection (Stripe Card or SEPA)
 * - Form validation
 * - Payment processing with status feedback
 * - Booking confirmation & navigation to MyBookings
 * - 401 auto-logout on token expiry
 *
 * Supported Payment Methods:
 * - Stripe (Card): Visa, Mastercard, Amex
 * - SEPA: Direct bank transfer via IBAN
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button, Card } from '../components';
import { getSessionDetails, bookClassWithPayment, getClassDetails, getCurrentSubscription, getBusinessPricing } from '../api';
import { usePayment, PaymentMethod, StripeHelper, SEPAHelper } from '../payments';
import { useAuth } from '../auth';
import { logger } from '../utils/logger';
import type { Class, Session, Subscription } from '../api/types';

type RootStackParamList = {
  BookClass: { businessId: string; classId: string; sessionId: string };
  MyBookings: undefined;
  ClassDetails: { businessId: string; classId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'BookClass'>;

export default function BookClassScreen({ route, navigation }: Props) {
  const { theme } = useThemeColors();
  const { logout } = useAuth();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const { businessId, classId, sessionId } = route.params;

  // Data loading
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pricing, setPricing] = useState<{ booking_base_eur?: number; guest_eur?: number } | null>(null);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.STRIPE);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  // Stripe fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // SEPA fields
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const { processing, error, processPayment } = usePayment();

  // Guests state (SRD: guest price ~ €20 each; base booking €25)
  const [guestsCount, setGuestsCount] = useState(0);

  /**
   * Format date for display
   * @param dateInput ISO string or timestamp
   * @returns Formatted date string (e.g., "Nov 15, 6:00 PM")
   */
  const formatDate = (dateInput?: string | number): string => {
    try {
      const d = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput || Date.now());
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      logger.warn('BookClassScreen', 'Failed to format date', { dateInput });
      return String(dateInput || '');
    }
  };

  /**
   * Load class, session, and subscription data
   */
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setDataError(null);

        logger.debug('BookClassScreen', 'Loading data', { businessId, classId, sessionId });

        // Load session
        let loadedSession: Session | null = null;
        if (sessionId) {
          try {
            const sessionRes = await getSessionDetails(businessId, sessionId);
            if (mounted) {
              loadedSession = sessionRes?.data || sessionRes;
              setSession(loadedSession);
              logger.debug('BookClassScreen', 'Session loaded', { sessionId, session: loadedSession });
            }
          } catch (err) {
            logger.error('BookClassScreen', 'Failed to load session', { sessionId, error: err });
            if (mounted) {
              setDataError('Failed to load session details. Please try again.');
            }
            return; // Can't proceed without session
          }
        }

        // Load class
        if (classId) {
          try {
            const classRes = await getClassDetails(businessId, classId);
            if (mounted) {
              const classData = classRes?.data?.class || classRes?.class || classRes;
              setClassInfo(classData);
              logger.debug('BookClassScreen', 'Class loaded', { classId, class: classData });
            }
          } catch (err) {
            logger.error('BookClassScreen', 'Failed to load class', { classId, error: err });
            if (mounted) {
              setDataError('Failed to load class details. Please try again.');
            }
            return; // Can't proceed without class
          }
        }

        // Load subscription (to check if free or paid)
        try {
          const subRes = await getCurrentSubscription();
          if (mounted) {
            const sub = subRes?.data || subRes;
            setSubscription(sub);
            logger.debug('BookClassScreen', 'Subscription loaded', { status: sub?.status });
          }
        } catch (err) {
          // Non-fatal: if subscription load fails, treat as no active subscription
          logger.warn('BookClassScreen', 'Failed to load subscription', { error: err });
          if (mounted) {
            setSubscription(null);
          }
        }

        // Load business pricing (configurable by gym owners)
        try {
          if (mounted && businessId) {
            const pricingRes = await getBusinessPricing(businessId);
            const cfg = pricingRes?.data || pricingRes || null;
            setPricing(cfg);
            logger.debug('BookClassScreen', 'Pricing loaded', cfg);
          }
        } catch (err) {
          logger.warn('BookClassScreen', 'Pricing not available, using defaults', { error: err });
        }
      } catch (err) {
        logger.error('BookClassScreen', 'Unexpected error loading data', { error: err });
        if (mounted) {
          setDataError('An unexpected error occurred. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [businessId, classId, sessionId]);

  /**
   * Calculate final price
   * - Free if user has active subscription
   * - €20 (2000 cents) if no subscription
   */
  const { totalInCents, isFree, displayMainPrice, basePriceEur, guestsPriceEur, totalDisplay } = useMemo(() => {
    const hasActiveSubscription = subscription?.status === 'active';

    const BASE_EUR = (classInfo?.price ?? pricing?.booking_base_eur ?? 25); // booking price
    const GUEST_EUR = (pricing?.guest_eur ?? 20); // per guest
    const main = hasActiveSubscription ? 0 : BASE_EUR;
    const total = (main + (guestsCount * GUEST_EUR));

    return {
      totalInCents: Math.round(total * 100),
      isFree: hasActiveSubscription,
      displayMainPrice: hasActiveSubscription ? 'FREE' : `€${main.toFixed(2)}`,
      basePriceEur: BASE_EUR,
      guestsPriceEur: GUEST_EUR,
      totalDisplay: `€${total.toFixed(2)}`,
    };
  }, [subscription, guestsCount, classInfo, pricing]);

  /**
   * Handle payment and booking
   */
  const handlePayment = useCallback(async () => {
    try {
      // Validate inputs by payment method
      if (paymentMethod === PaymentMethod.STRIPE) {
        const validation = StripeHelper.validateCard(cardNumber, cardExpiry, cardCvc);
        if (!validation.valid) {
          Alert.alert('Invalid Card', validation.errors[0] || 'Please check your card details');
          return;
        }
      } else if (paymentMethod === PaymentMethod.SEPA) {
        const validation = SEPAHelper.validateSEPA(iban, accountHolder);
        if (!validation.valid) {
          Alert.alert('Invalid SEPA Details', validation.errors[0] || 'Please check your SEPA information');
          return;
        }
      }

      const description = `${classInfo?.name || 'Class'} - ${formatDate(session?.start_time)}`;

      logger.debug('BookClassScreen', 'Starting payment', {
        amount: totalInCents,
        method: paymentMethod,
        description,
      });

      // Process payment
      const paymentResponse = await processPayment({
        amount: totalInCents,
        currency: 'EUR',
        description,
        paymentMethod,
        businessId,
        sessionId,
        classId,
        cardNumber: paymentMethod === PaymentMethod.STRIPE ? cardNumber.replace(/\s/g, '') : undefined,
        cardExpiry: paymentMethod === PaymentMethod.STRIPE ? cardExpiry : undefined,
        cardCvc: paymentMethod === PaymentMethod.STRIPE ? cardCvc : undefined,
        sepaIban: paymentMethod === PaymentMethod.SEPA ? iban : undefined,
        sepaAccountHolder: paymentMethod === PaymentMethod.SEPA ? accountHolder : undefined,
      });

      logger.debug('BookClassScreen', 'Payment succeeded', { transactionId: paymentResponse.transactionId });

      // Create booking on backend with payment proof
      await bookClassWithPayment(
        businessId,
        classId,
        sessionId,
        paymentResponse.transactionId,
        { guestsCount, basePriceEur: isFree ? 0 : (basePriceEur || 25) }
      );

      logger.info('BookClassScreen', 'Booking confirmed', { sessionId, transactionId: paymentResponse.transactionId });

      // Show success and navigate
      Alert.alert('Success', 'Class booked successfully!', [
        {
          text: 'View Bookings',
          onPress: () => navigation.navigate('MyBookings'),
        },
      ]);
    } catch (err: any) {
      logger.error('BookClassScreen', 'Payment or booking failed', { error: err });

      // Handle 401 (token issue) without auto-logout
      if (err?.statusCode === 401 || err?.code === 'UNAUTHORIZED' || err?.code === 401) {
        Alert.alert('Action Blocked', 'Your session may have expired. Please retry the action or re-login from Profile.');
        return;
      }

      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Payment failed. Please try again.');
      Alert.alert('Payment Failed', errorMessage);
    }
  }, [paymentMethod, cardNumber, cardExpiry, cardCvc, iban, accountHolder, totalInCents, processPayment, classInfo, session, businessId, classId, sessionId, navigation, logout]);

  /**
   * Retry loading data
   */
  const handleRetry = useCallback(() => {
    setDataError(null);
    setLoading(true);
    // Trigger useEffect again
    window.location.reload(); // Note: won't work in RN, handled by dependency array
  }, []);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text, marginTop: 16 }]}>
          Loading class details...
        </Text>
      </View>
    );
  }

  // Error state
  if (dataError) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.error, marginTop: 16 }]}>Error</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.textMuted }]}>{dataError}</Text>
        <Button
          theme={theme}
          title="Back"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  // Missing required data
  if (!session || !classInfo) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <MaterialIcons name="warning" size={48} color={theme.colors.warning} />
        <Text style={[styles.errorTitle, { color: theme.colors.warning, marginTop: 16 }]}>
          Missing Information
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.textMuted }]}>
          Unable to load class or session details.
        </Text>
        <Button
          theme={theme}
          title="Back"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Class Info Card */}
        <Card theme={theme} style={styles.card}>
          <Text style={[sharedStyles.title, { marginBottom: 8 }]}>{classInfo.name}</Text>
          <Text style={[sharedStyles.bodySecondary, { marginBottom: 4 }]}>
            {classInfo.trainer?.first_name || 'Trainer'} {classInfo.trainer?.last_name || ''}
          </Text>

          {/* Price & Free Badge */}
          <View style={[styles.priceRow, { marginTop: 12, borderTopColor: theme.colors.border }]}>
            <View>
              <Text style={[sharedStyles.caption]}>Booking price</Text>
              <Text style={[styles.priceText, { color: isFree ? theme.colors.success : theme.colors.primary }]}>
                {displayMainPrice}
              </Text>
            </View>
            {isFree && (
              <View
                style={[
                  styles.freeBadge,
                  { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success },
                ]}
              >
                <Text style={[styles.freeBadgeText, { color: theme.colors.success }]}>
                  ✓ Included in plan
                </Text>
              </View>
            )}
          </View>

          {/* Session Time */}
          <Text style={[sharedStyles.caption, { marginTop: 12 }]}>Session Time</Text>
          <Text style={[sharedStyles.body, { marginTop: 4 }]}>{formatDate(session.start_time)}</Text>

          {/* Capacity Info */}
          <Text style={[sharedStyles.caption, { marginTop: 12 }]}>Availability</Text>
          <Text style={[sharedStyles.body, { marginTop: 4 }]}>
            {session.available_spots} of {session.max_capacity} spots available
          </Text>
        </Card>

          {/* Guests Selector */}
          <Card theme={theme} style={styles.card}>
            <Text style={[sharedStyles.subtitle, { marginBottom: 8 }]}>Guests</Text>
            <Text style={[sharedStyles.bodySecondary, { marginBottom: 12 }]}>€{guestsPriceEur.toFixed(2)} per guest</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setGuestsCount(Math.max(0, guestsCount - 1))}
                style={[styles.adjustBtn, { borderColor: theme.colors.border }]}
              >
                <MaterialIcons name="remove" size={18} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[sharedStyles.title]}>{guestsCount}</Text>
              <TouchableOpacity
                onPress={() => setGuestsCount(Math.min(10, guestsCount + 1))}
                style={[styles.adjustBtn, { borderColor: theme.colors.border }]}
              >
                <MaterialIcons name="add" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Payment Section (Skip if Free) */}
        {!isFree && (
          <Card theme={theme} style={styles.card}>
            <Text style={[sharedStyles.subtitle, { marginBottom: 16 }]}>Payment Method</Text>

            {/* Method Selector */}
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  {
                    borderColor: paymentMethod === PaymentMethod.STRIPE ? theme.colors.primary : theme.colors.border,
                    backgroundColor: paymentMethod === PaymentMethod.STRIPE ? theme.colors.primary + '10' : 'transparent',
                  },
                ]}
                onPress={() => setPaymentMethod(PaymentMethod.STRIPE)}
              >
                <MaterialIcons
                  name="credit-card"
                  size={20}
                  color={paymentMethod === PaymentMethod.STRIPE ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[styles.methodLabel, { color: theme.colors.text }]}>Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  {
                    borderColor: paymentMethod === PaymentMethod.SEPA ? theme.colors.primary : theme.colors.border,
                    backgroundColor: paymentMethod === PaymentMethod.SEPA ? theme.colors.primary + '10' : 'transparent',
                  },
                ]}
                onPress={() => setPaymentMethod(PaymentMethod.SEPA)}
              >
                <MaterialIcons
                  name="account-balance"
                  size={20}
                  color={paymentMethod === PaymentMethod.SEPA ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={[styles.methodLabel, { color: theme.colors.text }]}>Bank Transfer</Text>
              </TouchableOpacity>
            </View>

            {/* Card Input */}
            {paymentMethod === PaymentMethod.STRIPE && (
              <View style={{ marginTop: 16 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.inputBg,
                    },
                  ]}
                  placeholder="Card Number (16 digits)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={cardNumber}
                  keyboardType="number-pad"
                  onChangeText={(t) => setCardNumber(StripeHelper.formatCardNumber(t))}
                  editable={!processing}
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        borderColor: theme.colors.inputBorder,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.inputBg,
                      },
                    ]}
                    placeholder="MM/YY"
                    placeholderTextColor={theme.colors.textMuted}
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    editable={!processing}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        width: 100,
                        borderColor: theme.colors.inputBorder,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.inputBg,
                      },
                    ]}
                    placeholder="CVC"
                    placeholderTextColor={theme.colors.textMuted}
                    value={cardCvc}
                    onChangeText={setCardCvc}
                    keyboardType="number-pad"
                    editable={!processing}
                  />
                </View>
              </View>
            )}

            {/* SEPA Input */}
            {paymentMethod === PaymentMethod.SEPA && (
              <View style={{ marginTop: 16 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.inputBg,
                    },
                  ]}
                  placeholder="IBAN (e.g., DE89370400440532013000)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={iban}
                  onChangeText={setIban}
                  editable={!processing}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      marginTop: 12,
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.inputBg,
                    },
                  ]}
                  placeholder="Account Holder Name"
                  placeholderTextColor={theme.colors.textMuted}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                  editable={!processing}
                />
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.colors.error + '20', marginTop: 12 },
                ]}
              >
                <MaterialIcons name="error" size={16} color={theme.colors.error} />
                <Text style={[styles.errorText, { color: theme.colors.error, marginLeft: 8 }]}>
                  {error.message}
                </Text>
              </View>
            )}

            {/* Pay Button */}
            {/* Total */}
            <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
              <Text style={sharedStyles.subtitle}>Total</Text>
              <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>{totalDisplay}</Text>
            </View>

            <Button
              theme={theme}
              title={processing ? 'Processing...' : `Pay ${totalDisplay}`}
              onPress={handlePayment}
              disabled={processing}
              loading={processing}
              fullWidth
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        {/* Free Booking Button */}
        {isFree && (
          <Button
            theme={theme}
            title={guestsCount > 0 ? `Pay for guests (${totalDisplay})` : 'Book Class (Free)'}
            onPress={handlePayment}
            disabled={processing}
            loading={processing}
            fullWidth
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
  },
  freeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginTop: 8,
  },
  errorBox: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  adjustBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
});
