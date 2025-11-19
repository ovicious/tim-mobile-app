# Member App Dashboard – Features and Design

This document summarizes the dashboard improvements for the Member app, aligning with SRD guidance and shared practices from the Admin mobile app.

## Goals
- Modern, cohesive UI using a single icon set (MaterialIcons) and centralized theme.
- Modular components for maintainability and reuse.
- Minimal API calls; prefer consolidated/derived data when possible.
- Enterprise-safe stack: no restricted licenses; use built-in RN/Expo + community MIT packages already in repo.

## Features Implemented

### Working Features
- ✅ Top-center TK Sport banner on Dashboard Home, with a top-right notifications icon
- ✅ Greeting + clickable Gym Name (navigates to the Gym tab – date-switchable schedule)
- ✅ Error banner for failure states
- ✅ Profile Completion card (prompts to finish key fields)
- ✅ Gym Info card (gym name and address; tapping name or Browse Classes navigates to schedule)
- ✅ Profile Quick Access card (shows name, email; "Edit" button)
- ✅ Quick Actions (New Booking → schedule, My Booking → list)
- ✅ Shop section with small cards: Membership, Vouchers, Tickets, Credit
  - Membership → Subscriptions
  - Vouchers/Tickets/Credit → placeholder screens (navigable)
- ✅ Next Class card (highlights nearest upcoming booking)
- ✅ My Bookings preview (up to 3 upcoming)
- ✅ Date-switchable class schedule under Gym tab; session-level booking flow
- ✅ My Bookings full list (navigate to MyBookingsScreen)
- ✅ Edit Profile navigation

### Not Yet Functional (Backend Missing)
- ⏳ Subscription Status (endpoint /api/v1/subscriptions/me not implemented)
  - Dashboard shows graceful fallback: "Subscriptions coming soon. Book individual classes anytime!"
  - Redirects to Classes screen instead of non-existent Subscriptions screen
- ⏳ Subscription Plans (SubscriptionsScreen expects backend endpoint)
- ⏳ My Subscription management (MySubscriptionScreen expects backend endpoint)

## Components (Modular)
- `components/dashboard/TopBanner.tsx` – TK Sport badge
- `components/dashboard/ShopSection.tsx` – Membership/Vouchers/Tickets/Credit cards
- `components/dashboard/ProfileCompletionCard.tsx`
- `components/dashboard/NextClassCard.tsx`
- `components/dashboard/GymInfoCard.tsx`
- `components/dashboard/ProfileQuickAccessCard.tsx`

## Data and API Usage
### Active Endpoints
- ✅ GET /api/v1/auth/profile
- ✅ GET /api/v1/{business_id}/my-bookings
- ✅ GET /api/v1/{business_id}/classes
- ✅ GET /api/v1/{business_id}/classes/{class_id}
- ✅ GET /api/v1/{business_id}/classes/{class_id}/sessions
- ✅ GET /api/v1/{business_id}/sessions/{session_id}
- ✅ POST /api/v1/{business_id}/classes/{class_id}/book (with transaction_id, guests_count)

### Missing Endpoints (Graceful Fallback)
- ⏳ GET /api/v1/subscriptions/me (returns error; handled gracefully)
- ⏳ GET /api/v1/{business_id}/subscriptions/plans
- ⏳ POST /api/v1/subscriptions
- ⏳ POST /api/v1/subscriptions/{id}/cancel
- ⏳ POST /api/v1/subscriptions/{id}/pause

**Normalization:** `getMyBookings()` always returns an array to avoid runtime shape issues.

## Security & Privacy
- Tokens read from Expo SecureStore post-login; no tokens in .env.
- No PII is persisted outside necessary state; data is not logged.
- CORS and authorizer fixed on backend to ensure consistent Bearer token usage.

## UX/Theme
- Uses centralized theme (app/theme) and MaterialIcons for dashboard UI.
- Cards use consistent spacing, border radii, and color roles from the theme.
- Empty states and actions are clear and minimal.
- Graceful degradation when backend endpoints are unavailable.

### Booking Price Model (SRD)
- Base booking price: gym-configurable (default €25; FREE if active subscription)
- Guest price: gym-configurable (default €20 per guest; guests are always payable)
- The booking screen shows a guest stepper, price breakdown, and total before payment.
 - Class Details shows price (defaults to €25 if missing) and notes guest pricing at €20 each.
 - Admins can set subscription fees, class booking base fee, and guest fee from the Admin Panel/Mobile; app reads `/api/v1/{business_id}/pricing` when available.

## Navigation Map
- Profile Completion → EditProfile
- Gym Name / Browse Classes → Gym tab (date switcher + sessions)
- Profile Quick Access → EditProfile
- Subscription (when unavailable) → Classes
- Quick Actions: New Booking → Gym tab; My Booking → MyBookings
- Next Class → MyBookings
- Upcoming Bookings preview → MyBookings
- Shop cards → Membership (Subscriptions), Vouchers/Tickets/Credit (placeholders)

## Future Enhancements (SRD-aligned)
- **Backend:** Implement subscription endpoints (/subscriptions/me, /plans, /create, /cancel, /pause)
- Recommendations and streaks derived from past bookings (if status data is available)
- Announcements/notifications card (requires backend endpoint)
- Dashboard summary endpoint to reduce multiple API calls
- Progress tracking/fitness goals card

## Testing Checklist
- [x] Profile Completion shows when fields missing
- [x] Gym Info displays when business data available
- [x] Profile Quick Access shows name and email
- [x] Classes navigation works
- [x] My Bookings navigation works
- [x] EditProfile navigation works
- [x] Next Class appears when bookings exist
- [x] Subscription fallback message appears when endpoint unavailable
- [ ] Subscription management when backend ready
- [ ] Subscription plans selection when backend ready

