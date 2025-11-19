# Quick Reference - Member App Payment Module

**Status**: ✅ Task 9 Complete | Ready for Task 7  
**Files**: 5 modules in `/app/payments/`  
**Lines**: ~1,130 LOC  

---

## Quick Start

### Import Payment Hook
```typescript
import { usePayment, PaymentMethod } from '../payments';
```

### Use in Component
```typescript
const { processing, error, processPayment } = usePayment();

await processPayment({
  amount: 2000,           // €20.00 in cents
  currency: 'EUR',
  description: 'Class Booking',
  paymentMethod: PaymentMethod.STRIPE,
  businessId: 'gym-123',
}, {
  onSuccess: () => Alert.alert('Success!'),
  onError: (err) => Alert.alert('Error', err.message),
});
```

---

## Payment Methods

```typescript
PaymentMethod.STRIPE    // Stripe card payment
PaymentMethod.CARD      // Alias for STRIPE
PaymentMethod.SEPA      // SEPA direct debit
```

---

## Stripe Card Validation

```typescript
import { StripeHelper, CardType } from '../payments';

// Detect card type
const type = StripeHelper.detectCardType('4532015112830366');
// Returns: CardType.VISA

// Validate complete card
const validation = StripeHelper.validateCard(
  cardNumber,
  expiryDate,    // MM/YY or MM/YYYY
  cvc
);

if (!validation.valid) {
  console.log(validation.errors[0]); // Error message
}

// Format for display
StripeHelper.formatCardNumber(cardNumber);  // '4532 0151 1283 0366'
StripeHelper.maskCardNumber(cardNumber);    // 'VISA •••• 0366'
```

---

## SEPA IBAN Validation

```typescript
import { SEPAHelper } from '../payments';

// Validate IBAN
const validation = SEPAHelper.validateIBAN('DE89370400440532013000');
// Returns: { valid, ibanValid, countryCode, isSEPACountry, errors[] }

// Format for display
SEPAHelper.formatIBAN(iban);                 // 'DE89 3704 0044 ...'
SEPAHelper.maskIBAN(iban);                   // 'DE** •••• 3000'

// Country info
SEPAHelper.getCountryName('DE');             // 'Germany'
SEPAHelper.getCountryFlag('DE');             // '🇩🇪'
SEPAHelper.isSEPACountry('DE');              // true

// List all SEPA countries
const countries = SEPAHelper.listSEPACountries();
// [{ code: 'AT', name: 'Austria', flag: '🇦🇹' }, ...]
```

---

## Payment States

```typescript
PaymentStatus.PENDING      // Waiting to process
PaymentStatus.PROCESSING   // Request in flight
PaymentStatus.SUCCESS      // Payment successful
PaymentStatus.FAILED       // Payment failed
PaymentStatus.CANCELLED    // User cancelled
```

---

## Error Types

```typescript
PaymentErrorType.NETWORK_ERROR      // No internet
PaymentErrorType.INVALID_CARD       // Card format error
PaymentErrorType.CARD_DECLINED      // Card rejected
PaymentErrorType.INSUFFICIENT_FUNDS // Not enough money
PaymentErrorType.EXPIRED_CARD       // Card expired
PaymentErrorType.INVALID_SEPA       // IBAN invalid
PaymentErrorType.UNAUTHORIZED       // 401/403 (auto-logout)
PaymentErrorType.UNKNOWN            // Other error
```

---

## Hook State

```typescript
{
  processing: boolean,           // Is payment processing?
  status: PaymentStatus | null,  // Current status
  error: PaymentError | null,    // Error if failed
  transactionId: string | null,  // Transaction ID
  processPayment: (req, opts?) => Promise<PaymentResponse>,
  clearError: () => void,
  reset: () => void,
}
```

---

## Backend Integration

### Stripe Endpoint
```
POST /api/v1/payments/stripe

{
  amount, currency, description,
  business_id, session_id, class_id, booking_id,
  stripe_token, card_number, card_expiry, card_cvc,
  metadata
}
```

### SEPA Endpoint
```
POST /api/v1/payments/sepa

{
  amount, currency, description,
  business_id, session_id, class_id, booking_id,
  sepa_iban, sepa_account_holder,
  metadata
}
```

Both return:
```typescript
{
  transaction_id: string,
  status: 'success' | 'failed',
  amount: number,
  currency: string,
  created_at: string
}
```

---

## Test Cards (For Development)

**Stripe Test Cards**:
- 4532015112830366 (Visa - Success)
- 5425233010103442 (Mastercard - Success)
- 378282246310005 (Amex - Success)

**Stripe Test IBANs** (For SEPA in test mode):
- DE89370400440532013000
- FR1420041010050500013M02606

---

## Common Patterns

### Form with Validation
```typescript
const { processing, error, processPayment } = usePayment();
const [cardNumber, setCardNumber] = useState('');
const [expiry, setExpiry] = useState('');
const [cvc, setCvc] = useState('');

const handlePay = async () => {
  // Validate
  const validation = StripeHelper.validateCard(
    cardNumber, expiry, cvc
  );
  if (!validation.valid) {
    Alert.alert('Invalid Card', validation.errors[0]);
    return;
  }

  // Process
  await processPayment({
    amount: 2000,
    currency: 'EUR',
    description: 'Class Booking',
    paymentMethod: PaymentMethod.STRIPE,
    businessId,
    cardNumber,
    cardExpiry: expiry,
    cardCvc: cvc,
  }, {
    onSuccess: () => {
      Alert.alert('Success!', 'Your booking is confirmed');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Payment Failed', error.message);
    },
  });
};
```

### SEPA Form
```typescript
const [iban, setIban] = useState('');
const [holder, setHolder] = useState('');

const handlePay = async () => {
  // Validate
  const validation = SEPAHelper.validateSEPA(iban, holder);
  if (!validation.valid) {
    Alert.alert('Invalid SEPA', validation.errors[0]);
    return;
  }

  // Process
  await processPayment({
    amount: 2000,
    currency: 'EUR',
    description: 'Class Booking',
    paymentMethod: PaymentMethod.SEPA,
    businessId,
    sepaIban: iban,
    sepaAccountHolder: holder,
  }, {
    onSuccess: () => { /* ... */ },
    onError: (error) => { /* ... */ },
  });
};
```

---

## Utility Functions

```typescript
// Format amount (cents to currency)
PaymentClient.formatAmount(2000, 'EUR');  // '€20.00'

// Parse amount (currency to cents)
PaymentClient.parseAmount('€20.00');      // 2000

// Get payment client singleton
getPaymentClient();

// Reset client (testing)
resetPaymentClient();
```

---

## Modules

| File | Purpose | Export |
|------|---------|--------|
| paymentClient.ts | Main processor | PaymentClient, enums |
| usePayment.ts | React hook | usePayment hook |
| stripeHelper.ts | Card validation | StripeHelper |
| sepaHelper.ts | IBAN validation | SEPAHelper |
| index.ts | Central export | Everything |

---

## Next: Task 7 (BookClassScreen)

1. Create BookClassScreen.tsx
2. Import `usePayment` hook
3. Add payment method selector (Stripe/SEPA tabs)
4. Add card inputs (if Stripe) with StripeHelper validation
5. Add IBAN inputs (if SEPA) with SEPAHelper validation
6. Call `processPayment()` on submit
7. Create booking on success
8. Show error alerts on failure

**Estimated Time**: 1-2 days  
**Complexity**: Medium  
**Blockers**: None ✅  

---

*Generated: December 2024*  
*Payment Module Quick Reference for Task 7*
