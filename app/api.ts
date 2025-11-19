/**
 * API Module - Backward Compatibility Layer
 * 
 * This file provides backward-compatible exports for the legacy API interface.
 * New code should import directly from app/api/client.ts and modular endpoint files.
 * 
 * For new development, use:
 * - import { apiClient } from './api/client'
 * - import { login, logout, getProfile } from './api/auth'
 */

// Export modular client and endpoints for new code
export { apiClient, BASE_URL } from './api/client';
export { login, logout } from './api/auth';
export { getProfile } from './api/auth';

// Backward compatibility - export BASE_URL as API_BASE_URL as well
export { BASE_URL as API_BASE_URL } from './api/client';

// Legacy exports for backward compatibility
export async function apiGet(path: string) {
  const { apiClient } = await import('./api/client');
  return apiClient.get(path);
}

export async function apiPost(path: string, body: any) {
  const { apiClient } = await import('./api/client');
  return apiClient.post(path, body);
}

export async function apiDelete(path: string) {
  const { apiClient } = await import('./api/client');
  return apiClient.delete(path);
}

export async function apiPut(path: string, body: any) {
  const { apiClient } = await import('./api/client');
  return apiClient.put(path, body);
}

// Gym classes API (generic helpers kept for compatibility)
export type GymClass = { id: string; name: string };

export async function getClasses(): Promise<GymClass[]> {
  return apiGet('/api/v1/classes');
}

export async function bookClass(classId: string): Promise<any> {
  return apiPost('/api/v1/bookings', { classId });
}

// Business-scoped classes and sessions per OpenAPI
export async function getClassesForBusiness(businessId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/classes`);
}

export async function getSessionsForClass(businessId: string, classId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/classes/${classId}/sessions`);
}

export async function bookClassSession(
  businessId: string,
  classId: string,
  sessionId: string
): Promise<any> {
  return await apiPost(`/api/v1/${businessId}/classes/${classId}/book`, { session_id: sessionId });
}

// Bookings
export async function getMyBookings(businessId: string): Promise<any[]> {
  const resp = await apiGet(`/api/v1/${businessId}/my-bookings`);
  // Normalize backend shapes to always return an array of bookings
  // Possible shapes:
  // - { success, message, data: { bookings: [...], count } }
  // - { bookings: [...], count }
  // - [...]
  const bookings = resp?.data?.bookings ?? resp?.bookings ?? (Array.isArray(resp) ? resp : []);
  return Array.isArray(bookings) ? bookings : [];
}

export async function cancelBooking(
  businessId: string,
  classId: string,
  bookingId: string
): Promise<any> {
  // API uses DELETE at /api/v1/{business_id}/classes/{class_id}/bookings/{booking_id}
  return await apiDelete(`/api/v1/${businessId}/classes/${classId}/bookings/${bookingId}`);
}

// Subscriptions
export async function getSubscriptionPlans(businessId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/subscriptions/plans`);
}

export async function getCurrentSubscription(): Promise<any> {
  return await apiGet('/api/v1/subscriptions/me');
}

export async function createSubscription(planType: string, businessId: string): Promise<any> {
  return await apiPost('/api/v1/subscriptions', { plan_type: planType, business_id: businessId });
}

export async function cancelSubscription(subscriptionId: string): Promise<any> {
  return await apiPost(`/api/v1/subscriptions/${subscriptionId}/cancel`, {});
}

export async function pauseSubscription(subscriptionId: string): Promise<any> {
  return await apiPost(`/api/v1/subscriptions/${subscriptionId}/pause`, {});
}

// Business Pricing (configurable by gym owners via admin)
export async function getBusinessPricing(businessId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/pricing`);
}

// Single class booking with payment
// POST /api/v1/{business_id}/classes/{class_id}/book with session_id and optional transactionId
export async function bookClassWithPayment(
  businessId: string,
  classId: string,
  sessionId: string,
  transactionId?: string,
  opts?: { guestsCount?: number; basePriceEur?: number }
): Promise<any> {
  const body: any = { session_id: sessionId };
  if (transactionId) {
    body.transaction_id = transactionId; // Optional: proof of payment (if backend requires)
  }
  if (opts?.guestsCount != null) {
    body.guests_count = opts.guestsCount;
  }
  if (opts?.basePriceEur != null) {
    body.base_price_eur = opts.basePriceEur;
  }
  return await apiPost(`/api/v1/${businessId}/classes/${classId}/book`, body);
}

// Class details
export async function getClassDetails(businessId: string, classId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/classes/${classId}`);
}

export async function getSessionDetails(businessId: string, sessionId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/sessions/${sessionId}`);
}

// Authentication
export async function changePassword(currentPassword: string, newPassword: string): Promise<any> {
  return await apiPost('/api/v1/auth/change-password', { current_password: currentPassword, new_password: newPassword });
}

// Business details (gym info, contact, social media)
export async function getBusinessDetails(businessId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/details`);
}

// Switch active gym
export async function switchGym(businessId: string): Promise<any> {
  return await apiPut('/api/v1/profile/switch-gym', { business_id: businessId });
}
