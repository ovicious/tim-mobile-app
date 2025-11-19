/**
 * API Types - Booking & Payment Data Models
 *
 * TypeScript interfaces matching backend API contract from FRONTEND_GUIDE.md
 * Ensures type safety and documentation for frontend-backend integration.
 */

// ============ Class & Session Models ============

export interface Class {
  class_id: string;
  business_id: string;
  name: string;
  description?: string;
  duration: number; // minutes (default: 60)
  capacity: number;
  price: number; // EUR or cents depending on API version
  currency: string; // 'EUR'
  trainer_id: string;
  trainer?: Trainer;
  minimum_bookings: number; // Default: 3
  booking_deadline: number; // Minutes before start (default: 60)
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  session_id: string;
  class_id: string;
  start_time: string; // ISO 8601 datetime
  end_time?: string; // ISO 8601 datetime
  available_spots: number;
  max_capacity: number;
  booked_count: number;
  status: 'active' | 'cancelled' | 'completed';
}

export interface Trainer {
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  profile_image_url?: string;
}

// ============ Booking Models ============

export interface Booking {
  booking_id: string;
  session_id: string;
  user_id: string;
  class_id: string;
  business_id: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  booked_at: string; // ISO 8601 datetime
  price: number; // EUR or cents
  currency: string; // 'EUR'
}

export interface BookingRequest {
  session_id: string;
  transaction_id?: string; // Optional: proof of payment
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking;
}

// ============ Subscription Models ============

export interface Subscription {
  id: string;
  user_id: string;
  business_id?: string;
  plan_type: string; // 'standard', 'vip', 'women_boxing', 'kids_boxing', '10_class', 'single_day'
  status: 'active' | 'inactive' | 'cancelled' | 'paused';
  next_billing_at?: string; // ISO 8601
  end_date?: string; // ISO 8601
  amount?: number; // Monthly cost in EUR
  currency?: string; // 'EUR'
  created_at?: string;
}

// ============ Payment Models ============

export interface PaymentRequest {
  amount: number; // In cents (e.g., 2000 for €20.00)
  currency: string; // 'EUR'
  description: string;
  paymentMethod: 'stripe' | 'sepa';
  businessId: string;
  sessionId: string;
  classId?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  sepaIban?: string;
  sepaAccountHolder?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'succeeded' | 'failed' | 'pending';
  amount: number;
  currency: string;
}

// ============ API Response Wrappers ============

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ClassDetailsResponse {
  class: Class;
  trainer?: Trainer;
}

export interface SessionListResponse {
  sessions: Session[];
}

// ============ Error Models ============

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}
