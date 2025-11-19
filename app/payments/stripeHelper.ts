/**
 * Stripe Integration Helper
 * 
 * Provides Stripe-specific utilities for card validation and formatting.
 * 
 * Note: Full Stripe SDK integration (react-native-stripe-sdk) would be added
 * in production. This module provides the frontend API layer.
 */

import { logger } from '../utils/logger';

/**
 * Card Type Detection
 */
export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  UNKNOWN = 'unknown',
}

/**
 * Card Validation Result
 */
export interface CardValidation {
  valid: boolean;
  cardType: CardType;
  errors: string[];
}

/**
 * Stripe Helper Class
 */
export class StripeHelper {
  /**
   * Detect card type from number
   */
  static detectCardType(cardNumber: string): CardType {
    const number = cardNumber.replace(/\D/g, '');

    // Visa: starts with 4
    if (/^4/.test(number)) {
      return CardType.VISA;
    }

    // Mastercard: starts with 51-55 or 2221-2720
    if (/^(5[1-5]|2[2-7])/.test(number)) {
      return CardType.MASTERCARD;
    }

    // American Express: starts with 34 or 37
    if (/^3[47]/.test(number)) {
      return CardType.AMEX;
    }

    // Discover: starts with 6011, 622126-622925, 644, 645, 646, 647, or 648
    if (/^(6011|622|64[4-8]|65)/.test(number)) {
      return CardType.DISCOVER;
    }

    return CardType.UNKNOWN;
  }

  /**
   * Validate card number using Luhn algorithm
   */
  static validateCardNumber(cardNumber: string): boolean {
    const number = cardNumber.replace(/\D/g, '');

    if (number.length < 13 || number.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate expiry date (MM/YY or MM/YYYY)
   */
  static validateExpiry(expiryDate: string): boolean {
    const match = expiryDate.match(/^(\d{1,2})\/(\d{2,4})$/);

    if (!match) {
      return false;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return false;
    }

    // Convert 2-digit year to 4-digit year
    const fullYear = year < 100 ? 2000 + year : year;

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Check if card is expired
    if (fullYear < currentYear) {
      return false;
    }

    if (fullYear === currentYear && month < currentMonth) {
      return false;
    }

    return true;
  }

  /**
   * Validate CVC/CVV
   */
  static validateCVC(cvc: string, cardType: CardType = CardType.UNKNOWN): boolean {
    const cvcNumber = cvc.replace(/\D/g, '');

    // American Express: 4 digits
    if (cardType === CardType.AMEX) {
      return /^\d{4}$/.test(cvcNumber);
    }

    // All other cards: 3 digits
    return /^\d{3}$/.test(cvcNumber);
  }

  /**
   * Validate complete card details
   */
  static validateCard(
    cardNumber: string,
    expiryDate: string,
    cvc: string
  ): CardValidation {
    const errors: string[] = [];
    const cardType = this.detectCardType(cardNumber);

    if (!this.validateCardNumber(cardNumber)) {
      errors.push('Invalid card number');
    }

    if (!this.validateExpiry(expiryDate)) {
      errors.push('Card has expired or invalid expiry date');
    }

    if (!this.validateCVC(cvc, cardType)) {
      errors.push('Invalid security code');
    }

    return {
      valid: errors.length === 0,
      cardType,
      errors,
    };
  }

  /**
   * Format card number with spaces (XXXX XXXX XXXX XXXX)
   */
  static formatCardNumber(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    return number.replace(/(\d{4})/g, '$1 ').trim();
  }

  /**
   * Format expiry date to MM/YY
   */
  static formatExpiry(expiryDate: string): string {
    const match = expiryDate.match(/^(\d{1,2})\/(\d{2,4})$/);

    if (!match) {
      return expiryDate;
    }

    const month = match[1].padStart(2, '0');
    const year = match[2].length === 4 ? match[2].slice(-2) : match[2];

    return `${month}/${year}`;
  }

  /**
   * Mask card number for display (show only last 4 digits)
   */
  static maskCardNumber(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    const lastFour = number.slice(-4);
    const cardType = this.detectCardType(number);

    return `${cardType.toUpperCase()} •••• ${lastFour}`;
  }

  /**
   * Get card type label
   */
  static getCardTypeLabel(cardType: CardType): string {
    switch (cardType) {
      case CardType.VISA:
        return 'Visa';
      case CardType.MASTERCARD:
        return 'Mastercard';
      case CardType.AMEX:
        return 'American Express';
      case CardType.DISCOVER:
        return 'Discover';
      default:
        return 'Unknown Card';
    }
  }
}

/**
 * In production, this would initialize the Stripe SDK:
 * 
 * import { initStripe } from '@stripe/stripe-react-native';
 * 
 * export async function initializeStripe() {
 *   await initStripe({
 *     publishableKey: 'pk_test_...' || 'pk_live_...',
 *     merchantIdentifier: 'merchant_id',
 *   });
 * }
 */

logger.debug('StripeHelper', 'Stripe integration helper loaded');
