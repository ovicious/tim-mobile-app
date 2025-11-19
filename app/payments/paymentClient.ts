/**
 * Payment Processing Module
 * 
 * Modular payment client for handling Stripe and SEPA payment flows.
 * Supports payment initiation, error handling, and success/failure callbacks.
 * 
 * Features:
 * - Modular Stripe/SEPA payment clients
 * - Error handling with user-friendly messages
 * - 401 auto-logout on unauthorized
 * - Success/failure callback support
 * - Loading state management
 * - Network error detection
 * - Payment method validation
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';
import { BASE_URL } from '../api/client';

/**
 * Payment Method Types
 */
export enum PaymentMethod {
  STRIPE = 'stripe',
  SEPA = 'sepa',
  CARD = 'card',
}

/**
 * Payment Status Types
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Payment Error Types
 */
export enum PaymentErrorType {
  NETWORK_ERROR = 'network_error',
  INVALID_CARD = 'invalid_card',
  CARD_DECLINED = 'card_declined',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  EXPIRED_CARD = 'expired_card',
  INVALID_SEPA = 'invalid_sepa',
  UNAUTHORIZED = 'unauthorized',
  UNKNOWN = 'unknown',
}

/**
 * Payment Response Interface
 */
export interface PaymentResponse {
  status: PaymentStatus;
  transactionId?: string;
  error?: PaymentError;
  data?: any;
}

/**
 * Payment Error Interface
 */
export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Payment Request Interface
 */
export interface PaymentRequest {
  amount: number; // Amount in cents (e.g., 2000 = €20.00)
  currency: string; // e.g., 'EUR'
  description: string; // e.g., 'Class Booking - Yoga Class'
  paymentMethod: PaymentMethod;
  businessId: string;
  sessionId?: string;
  classId?: string;
  bookingId?: string;
  // Stripe-specific
  stripeToken?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  // SEPA-specific
  sepaIban?: string;
  sepaAccountHolder?: string;
  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Payment Options Interface
 */
export interface PaymentOptions {
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: PaymentError) => void;
  onStatusChange?: (status: PaymentStatus) => void;
  timeout?: number; // Milliseconds, default 30000
}

/**
 * Main Payment Client Class
 */
export class PaymentClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Initialize payment client with auth token
   */
  async initialize(): Promise<void> {
    try {
      this.authToken = await SecureStore.getItemAsync('authToken');
      if (!this.authToken) {
        logger.warn('PaymentClient', 'No auth token found - user may need to re-authenticate');
      }
    } catch (error) {
      logger.error('PaymentClient', 'Failed to retrieve auth token', error);
    }
  }

  /**
   * Get authorization headers
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make payment request
   */
  private async makeRequest(
    endpoint: string,
    body: any,
    timeout: number = 30000
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    return Promise.race<Response>([
      fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Payment request timeout')), timeout)
      ),
    ]).then(async (response: Response) => {
      if (response.status === 401 || response.status === 403) {
        logger.warn('PaymentClient', '401/403 Unauthorized - clearing auth token', {
          status: response.status,
        });
        try {
          await SecureStore.deleteItemAsync('authToken');
        } catch (e) {
          logger.error('PaymentClient', 'Failed to clear authToken', e);
        }
        throw {
          type: PaymentErrorType.UNAUTHORIZED,
          message: 'Payment authorization failed. Please log in again.',
          code: String(response.status),
        };
      }

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        logger.error('PaymentClient', 'Payment request failed', {
          status: response.status,
          response: data,
        });
        throw data;
      }

      return data;
    });
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    request: PaymentRequest,
    options?: PaymentOptions
  ): Promise<PaymentResponse> {
    try {
      options?.onStatusChange?.(PaymentStatus.PROCESSING);

      // Validate required Stripe fields
      if (!request.stripeToken && !request.cardNumber) {
        throw this.createPaymentError(
          PaymentErrorType.INVALID_CARD,
          'Stripe token or card number is required'
        );
      }

      logger.debug('PaymentClient', 'Processing Stripe payment', {
        amount: request.amount,
        currency: request.currency,
        description: request.description,
      });

      // Make payment request to backend
      const response = await this.makeRequest('/api/v1/payments/stripe', {
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        business_id: request.businessId,
        session_id: request.sessionId,
        class_id: request.classId,
        booking_id: request.bookingId,
        stripe_token: request.stripeToken,
        card_number: request.cardNumber,
        card_expiry: request.cardExpiry,
        card_cvc: request.cardCvc,
        metadata: request.metadata,
      }, options?.timeout);

      logger.debug('PaymentClient', 'Stripe payment successful', {
        transactionId: response.transaction_id || response.id,
      });

      options?.onStatusChange?.(PaymentStatus.SUCCESS);

      const paymentResponse: PaymentResponse = {
        status: PaymentStatus.SUCCESS,
        transactionId: response.transaction_id || response.id,
        data: response,
      };

      options?.onSuccess?.(paymentResponse);
      return paymentResponse;
    } catch (error) {
      const paymentError = this.parsePaymentError(error, PaymentMethod.STRIPE);
      logger.error('PaymentClient', 'Stripe payment failed', paymentError);
      options?.onStatusChange?.(PaymentStatus.FAILED);
      options?.onError?.(paymentError);
      throw paymentError;
    }
  }

  /**
   * Process SEPA payment
   */
  async processSEPAPayment(
    request: PaymentRequest,
    options?: PaymentOptions
  ): Promise<PaymentResponse> {
    try {
      options?.onStatusChange?.(PaymentStatus.PROCESSING);

      // Validate required SEPA fields
      if (!request.sepaIban) {
        throw this.createPaymentError(
          PaymentErrorType.INVALID_SEPA,
          'SEPA IBAN is required'
        );
      }

      if (!request.sepaAccountHolder) {
        throw this.createPaymentError(
          PaymentErrorType.INVALID_SEPA,
          'Account holder name is required'
        );
      }

      // Validate IBAN format (basic check: 15-34 alphanumeric characters)
      if (!this.validateIBAN(request.sepaIban)) {
        throw this.createPaymentError(
          PaymentErrorType.INVALID_SEPA,
          'Invalid IBAN format'
        );
      }

      logger.debug('PaymentClient', 'Processing SEPA payment', {
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        accountHolder: request.sepaAccountHolder,
      });

      // Make payment request to backend
      const response = await this.makeRequest('/api/v1/payments/sepa', {
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        business_id: request.businessId,
        session_id: request.sessionId,
        class_id: request.classId,
        booking_id: request.bookingId,
        sepa_iban: request.sepaIban,
        sepa_account_holder: request.sepaAccountHolder,
        metadata: request.metadata,
      }, options?.timeout);

      logger.debug('PaymentClient', 'SEPA payment successful', {
        transactionId: response.transaction_id || response.id,
      });

      options?.onStatusChange?.(PaymentStatus.SUCCESS);

      const paymentResponse: PaymentResponse = {
        status: PaymentStatus.SUCCESS,
        transactionId: response.transaction_id || response.id,
        data: response,
      };

      options?.onSuccess?.(paymentResponse);
      return paymentResponse;
    } catch (error) {
      const paymentError = this.parsePaymentError(error, PaymentMethod.SEPA);
      logger.error('PaymentClient', 'SEPA payment failed', paymentError);
      options?.onStatusChange?.(PaymentStatus.FAILED);
      options?.onError?.(paymentError);
      throw paymentError;
    }
  }

  /**
   * Process payment by method
   */
  async processPayment(
    request: PaymentRequest,
    options?: PaymentOptions
  ): Promise<PaymentResponse> {
    await this.initialize();

    switch (request.paymentMethod) {
      case PaymentMethod.STRIPE:
      case PaymentMethod.CARD:
        return this.processStripePayment(request, options);
      case PaymentMethod.SEPA:
        return this.processSEPAPayment(request, options);
      default:
        throw this.createPaymentError(
          PaymentErrorType.UNKNOWN,
          `Unknown payment method: ${request.paymentMethod}`
        );
    }
  }

  /**
   * Validate IBAN format
   */
  private validateIBAN(iban: string): boolean {
    // Basic IBAN validation: 15-34 characters, alphanumeric
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(iban.toUpperCase().replace(/\s/g, ''));
  }

  /**
   * Parse payment error and convert to PaymentError
   */
  private parsePaymentError(error: any, method: PaymentMethod): PaymentError {
    logger.debug('PaymentClient', 'Parsing payment error', { error, method });

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createPaymentError(
        PaymentErrorType.NETWORK_ERROR,
        'Network error. Please check your internet connection and try again.'
      );
    }

    // Handle timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return this.createPaymentError(
        PaymentErrorType.NETWORK_ERROR,
        'Payment request timed out. Please try again.'
      );
    }

    // Handle authorization errors
    if (error.type === PaymentErrorType.UNAUTHORIZED) {
      return error;
    }

    // Handle Stripe-specific errors
    if (method === PaymentMethod.STRIPE || method === PaymentMethod.CARD) {
      if (typeof error === 'object' && error.code) {
        switch (error.code) {
          case 'card_declined':
            return this.createPaymentError(
              PaymentErrorType.CARD_DECLINED,
              'Your card was declined. Please try another payment method.'
            );
          case 'expired_card':
            return this.createPaymentError(
              PaymentErrorType.EXPIRED_CARD,
              'Your card has expired. Please use a different card.'
            );
          case 'incorrect_cvc':
          case 'invalid_cvc':
            return this.createPaymentError(
              PaymentErrorType.INVALID_CARD,
              'Invalid card security code. Please check and try again.'
            );
          case 'insufficient_funds':
            return this.createPaymentError(
              PaymentErrorType.INSUFFICIENT_FUNDS,
              'Insufficient funds. Please try another payment method.'
            );
          default:
            return this.createPaymentError(
              PaymentErrorType.INVALID_CARD,
              error.message || 'Card payment failed. Please try again.'
            );
        }
      }
    }

    // Handle SEPA-specific errors
    if (method === PaymentMethod.SEPA) {
      if (typeof error === 'object' && error.code) {
        switch (error.code) {
          case 'invalid_iban':
            return this.createPaymentError(
              PaymentErrorType.INVALID_SEPA,
              'Invalid IBAN. Please check and try again.'
            );
          case 'sepa_not_supported':
            return this.createPaymentError(
              PaymentErrorType.INVALID_SEPA,
              'SEPA is not supported for your region.'
            );
          default:
            return this.createPaymentError(
              PaymentErrorType.INVALID_SEPA,
              error.message || 'SEPA payment failed. Please try again.'
            );
        }
      }
    }

    // Generic error handling
    if (typeof error === 'string') {
      return this.createPaymentError(PaymentErrorType.UNKNOWN, error);
    }

    if (error instanceof Error) {
      return this.createPaymentError(PaymentErrorType.UNKNOWN, error.message);
    }

    if (typeof error === 'object' && error.message) {
      return this.createPaymentError(PaymentErrorType.UNKNOWN, error.message);
    }

    return this.createPaymentError(
      PaymentErrorType.UNKNOWN,
      'An unexpected error occurred. Please try again.'
    );
  }

  /**
   * Create PaymentError helper
   */
  private createPaymentError(
    type: PaymentErrorType,
    message: string,
    code?: string
  ): PaymentError {
    return {
      type,
      message,
      code,
    };
  }

  /**
   * Format amount for display (cents to currency)
   */
  static formatAmount(amountInCents: number, currency: string = 'EUR'): string {
    const amount = amountInCents / 100;
    const currencySymbol = currency === 'EUR' ? '€' : currency;
    return `${currencySymbol}${amount.toFixed(2)}`;
  }

  /**
   * Parse amount from formatted string
   */
  static parseAmount(formattedAmount: string): number {
    const match = formattedAmount.replace(/[€$]/g, '').match(/[\d.]+/);
    if (!match) {
      throw new Error('Invalid amount format');
    }
    return Math.round(parseFloat(match[0]) * 100);
  }
}

/**
 * Singleton instance
 */
let paymentClientInstance: PaymentClient | null = null;

/**
 * Get payment client singleton
 */
export function getPaymentClient(): PaymentClient {
  if (!paymentClientInstance) {
    paymentClientInstance = new PaymentClient();
  }
  return paymentClientInstance;
}

/**
 * Reset payment client (useful for testing)
 */
export function resetPaymentClient(): void {
  paymentClientInstance = null;
}
