/**
 * Payments Module Index
 * 
 * Central export for all payment-related functionality.
 * 
 * Usage:
 * import { usePayment, PaymentMethod } from './app/payments';
 * import { StripeHelper, SEPAHelper } from './app/payments';
 */

// Main payment client
export {
  PaymentClient,
  PaymentMethod,
  PaymentStatus,
  PaymentErrorType,
  getPaymentClient,
  resetPaymentClient,
  PaymentClient as default,
  type PaymentRequest,
  type PaymentResponse,
  type PaymentError,
  type PaymentOptions,
} from './paymentClient';

// Payment hooks
export {
  usePayment,
  type UsePaymentState,
  type UsePaymentActions,
  type UsePaymentReturn,
} from './usePayment';

// Stripe integration
export {
  StripeHelper,
  CardType,
  type CardValidation,
} from './stripeHelper';

// SEPA integration
export {
  SEPAHelper,
  SEPA_COUNTRIES,
  type SEPAValidation,
} from './sepaHelper';
