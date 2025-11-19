/**
 * SEPA Integration Helper
 * 
 * Provides SEPA (Single Euro Payments Area) utilities for IBAN validation
 * and account holder name formatting.
 * 
 * SEPA supports direct debits and transfers in EUR within the EU, EEA,
 * and some other countries.
 */

import { logger } from '../utils/logger';

/**
 * SEPA Country Codes
 */
export const SEPA_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  'GB', // United Kingdom (post-Brexit still supported)
  'CH', // Switzerland (associated)
  'AD', // Andorra
  'SM', // San Marino
  'MC', // Monaco
];

/**
 * IBAN Country Lengths
 */
const IBAN_LENGTHS: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

/**
 * SEPA Validation Result
 */
export interface SEPAValidation {
  valid: boolean;
  ibanValid: boolean;
  countryCode?: string;
  isSEPACountry?: boolean;
  errors: string[];
}

/**
 * SEPA Helper Class
 */
export class SEPAHelper {
  /**
   * Validate IBAN format and checksum
   * 
   * IBAN format: CC-KK-BBAN where:
   * - CC: 2-letter country code
   * - KK: 2-digit check number
   * - BBAN: Country-specific number
   */
  static validateIBAN(iban: string): SEPAValidation {
    const errors: string[] = [];
    const cleanIBAN = iban.toUpperCase().replace(/\s/g, '');

    // Basic format check
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIBAN)) {
      errors.push('Invalid IBAN format');
      return {
        valid: false,
        ibanValid: false,
        errors,
      };
    }

    // Extract country code
    const countryCode = cleanIBAN.substring(0, 2);
    const isSEPACountry = SEPA_COUNTRIES.includes(countryCode);

    // Validate IBAN length for country
    const expectedLength = IBAN_LENGTHS[countryCode];
    if (expectedLength && cleanIBAN.length !== expectedLength) {
      errors.push(`Invalid IBAN length for ${countryCode} (expected ${expectedLength})`);
    }

    // Validate IBAN checksum (mod-97)
    if (!this.validateIBANChecksum(cleanIBAN)) {
      errors.push('Invalid IBAN checksum');
    }

    return {
      valid: errors.length === 0,
      ibanValid: errors.length === 0,
      countryCode,
      isSEPACountry,
      errors,
    };
  }

  /**
   * Validate IBAN checksum using mod-97 algorithm
   */
  private static validateIBANChecksum(iban: string): boolean {
    // Move first 4 characters to end
    const rearranged = iban.substring(4) + iban.substring(0, 4);

    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    let numeric = '';
    for (let i = 0; i < rearranged.length; i++) {
      const char = rearranged[i];
      const code = char.charCodeAt(0);

      if (code >= 65 && code <= 90) {
        // A-Z
        numeric += (code - 55).toString();
      } else {
        numeric += char;
      }
    }

    // Calculate mod 97
    let remainder = numeric;
    while (remainder.length > 2) {
      const block = remainder.substring(0, 9);
      remainder = ((parseInt(block, 10) % 97) + remainder.substring(9)).toString();
    }

    return parseInt(remainder, 10) % 97 === 1;
  }

  /**
   * Format IBAN for display (XXXX XXXX XXXX XXXX ...)
   */
  static formatIBAN(iban: string): string {
    const clean = iban.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(\w{4})/g, '$1 ').trim();
  }

  /**
   * Mask IBAN for display (show only country code and last 4 digits)
   */
  static maskIBAN(iban: string): string {
    const clean = iban.replace(/\s/g, '').toUpperCase();

    if (clean.length < 6) {
      return clean;
    }

    const countryCode = clean.substring(0, 2);
    const lastFour = clean.slice(-4);

    return `${countryCode}** •••• ${lastFour}`;
  }

  /**
   * Validate account holder name
   * 
   * SEPA allows letters, numbers, and special characters
   * Minimum 1 character, maximum 70 characters
   */
  static validateAccountHolderName(name: string): boolean {
    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > 70) {
      return false;
    }

    // Allow letters, numbers, spaces, and common special characters
    return /^[a-zA-Z0-9\s\-'.&()]+$/.test(trimmed);
  }

  /**
   * Validate complete SEPA details
   */
  static validateSEPA(iban: string, accountHolderName: string): SEPAValidation {
    const ibanValidation = this.validateIBAN(iban);
    const errors = [...ibanValidation.errors];

    if (!this.validateAccountHolderName(accountHolderName)) {
      errors.push('Invalid account holder name');
    }

    return {
      valid: errors.length === 0,
      ibanValid: ibanValidation.ibanValid,
      countryCode: ibanValidation.countryCode,
      isSEPACountry: ibanValidation.isSEPACountry,
      errors,
    };
  }

  /**
   * Get country name from country code
   */
  static getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      AT: 'Austria',
      BE: 'Belgium',
      BG: 'Bulgaria',
      HR: 'Croatia',
      CY: 'Cyprus',
      CZ: 'Czech Republic',
      DK: 'Denmark',
      EE: 'Estonia',
      FI: 'Finland',
      FR: 'France',
      DE: 'Germany',
      GR: 'Greece',
      HU: 'Hungary',
      IE: 'Ireland',
      IT: 'Italy',
      LV: 'Latvia',
      LT: 'Lithuania',
      LU: 'Luxembourg',
      MT: 'Malta',
      NL: 'Netherlands',
      PL: 'Poland',
      PT: 'Portugal',
      RO: 'Romania',
      SK: 'Slovakia',
      SI: 'Slovenia',
      ES: 'Spain',
      SE: 'Sweden',
      GB: 'United Kingdom',
      CH: 'Switzerland',
      AD: 'Andorra',
      SM: 'San Marino',
      MC: 'Monaco',
    };

    return countryNames[countryCode] || 'Unknown Country';
  }

  /**
   * Get country flag emoji
   */
  static getCountryFlag(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
  }

  /**
   * Check if country is in SEPA zone
   */
  static isSEPACountry(countryCode: string): boolean {
    return SEPA_COUNTRIES.includes(countryCode.toUpperCase());
  }

  /**
   * List all SEPA countries with names and flags
   */
  static listSEPACountries(): Array<{
    code: string;
    name: string;
    flag: string;
  }> {
    return SEPA_COUNTRIES.map((code) => ({
      code,
      name: this.getCountryName(code),
      flag: this.getCountryFlag(code),
    }));
  }
}

logger.debug('SEPAHelper', 'SEPA integration helper loaded', {
  supportedCountries: SEPA_COUNTRIES.length,
});
