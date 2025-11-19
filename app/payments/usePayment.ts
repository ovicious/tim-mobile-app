/**
 * Payment Hooks - usePayment Hook
 * 
 * React hook for managing payment state and processing payments.
 * Simplifies payment integration in screens.
 * 
 * Usage:
 * const { 
 *   processing, 
 *   error, 
 *   processPayment 
 * } = usePayment();
 * 
 * const handlePayment = async () => {
 *   const result = await processPayment({
 *     amount: 2000, // €20.00
 *     currency: 'EUR',
 *     description: 'Yoga Class',
 *     paymentMethod: PaymentMethod.STRIPE,
 *     businessId: 'gym-123',
 *   }, {
 *     onSuccess: () => navigation.goBack(),
 *     onError: (error) => Alert.alert('Payment Failed', error.message),
 *   });
 * };
 */

import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';
import {
  PaymentClient,
  PaymentMethod,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  PaymentError,
  PaymentOptions,
  getPaymentClient,
} from './paymentClient';

export interface UsePaymentState {
  processing: boolean;
  status: PaymentStatus | null;
  error: PaymentError | null;
  transactionId: string | null;
}

export interface UsePaymentActions {
  processPayment: (request: PaymentRequest, options?: PaymentOptions) => Promise<PaymentResponse>;
  clearError: () => void;
  reset: () => void;
}

export type UsePaymentReturn = UsePaymentState & UsePaymentActions;

/**
 * usePayment Hook
 * 
 * Provides payment processing functionality with state management.
 */
export function usePayment(): UsePaymentReturn {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<PaymentError | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setProcessing(false);
    setStatus(null);
    setError(null);
    setTransactionId(null);
  }, []);

  const processPayment = useCallback(
    async (request: PaymentRequest, options?: PaymentOptions): Promise<PaymentResponse> => {
      try {
        setProcessing(true);
        setError(null);
        setStatus(PaymentStatus.PENDING);

        const client = getPaymentClient();

        // Custom status change handler that updates hook state
        const customOptions: PaymentOptions = {
          ...options,
          onStatusChange: (newStatus: PaymentStatus) => {
            setStatus(newStatus);
            options?.onStatusChange?.(newStatus);
          },
          onSuccess: (response: PaymentResponse) => {
            setStatus(PaymentStatus.SUCCESS);
            setTransactionId(response.transactionId || null);
            setProcessing(false);
            options?.onSuccess?.(response);
          },
          onError: (paymentError: PaymentError) => {
            setError(paymentError);
            setStatus(PaymentStatus.FAILED);
            setProcessing(false);
            options?.onError?.(paymentError);
          },
        };

        logger.debug('usePayment', 'Processing payment', {
          amount: request.amount,
          method: request.paymentMethod,
        });

        const response = await client.processPayment(request, customOptions);

        return response;
      } catch (err) {
        // Error should already be handled by onError callback
        // But in case it's not, log it here
        logger.error('usePayment', 'Unexpected error in processPayment', err);
        setProcessing(false);
        throw err;
      }
    },
    []
  );

  return {
    processing,
    status,
    error,
    transactionId,
    processPayment,
    clearError,
    reset,
  };
}

/**
 * Export payment utilities for direct use
 */
export {
  PaymentClient,
  PaymentMethod,
  PaymentStatus,
  PaymentErrorType,
  getPaymentClient,
  resetPaymentClient,
  type PaymentRequest,
  type PaymentResponse,
  type PaymentError,
  type PaymentOptions,
} from './paymentClient';
