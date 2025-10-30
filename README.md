# Gym Mobile App - Expo React Native

A mobile application for gym members and trainers built with Expo and React Native.

## 🚀 Features

### Authentication
- ✅ Secure login with JWT tokens
- ✅ Token storage using Expo SecureStore
- ✅ Auto-login on app launch
- ✅ Logout functionality
- ✅ Protected routes (requires authentication)

### User Features
- ✅ **Profile Screen**: View user profile with name, email, role, and business info
- ✅ **Classes Screen**: Browse available gym classes
- ✅ **Class Booking**: Book class sessions
- ✅ **My Bookings**: View and cancel bookings
- ✅ **Trainers Screen**: View available trainers

### Navigation
- ✅ Bottom tab navigation for main features
- ✅ Stack navigation for detailed views
- ✅ Conditional navigation based on authentication state
- ✅ Icons for all navigation tabs

### UI/UX
- ✅ Clean, modern interface inspired by gym apps
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ User-friendly alerts and feedback

## 🛠️ Tech Stack

- **Framework**: Expo ~54.0.20
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: React Context (Auth)
- **Secure Storage**: expo-secure-store
- **Icons**: @expo/vector-icons (Ionicons)
- **HTTP Client**: Native Fetch API

## 📦 Installation

```bash
# Install dependencies
npm install

# or using the Makefile
make install
```

## 🏃 Running the App

### Development

```bash
# Start Expo development server
npm start

# or using the Makefile
make start
```

### Platform-specific

```bash
# Run on Android
make android

# Run on iOS
make ios

# Run on web
make web
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API base URL for backend
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev

# Optional: Temporary dev token for testing
API_TOKEN=your-jwt-token-here
```

### API Integration

The app connects to the TIM Backend API. Base URL is configured via environment variables.

**Backend Endpoints Used:**
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `GET /api/v1/{business_id}/classes` - List classes
- `GET /api/v1/{business_id}/classes/{class_id}/sessions` - List class sessions
- `POST /api/v1/{business_id}/classes/{class_id}/book` - Book a session
- `GET /api/v1/{business_id}/my-bookings` - Get user bookings
- `DELETE /api/v1/{business_id}/classes/{class_id}/bookings/{booking_id}` - Cancel booking

## 📱 Screens

### Login Screen
- Email and password authentication
- Stores JWT token securely
- Auto-redirects to main app on successful login

### Profile Screen
- Displays user information
- Logout button
- Shows business association

### Classes Screen
- Lists available classes for the user's business
- Navigate to booking details

### Class Booking Screen
- View class details and available sessions
- Book sessions
- See session times and availability

### My Bookings Screen
- View all user bookings
- Cancel bookings
- See booking status

### Trainers Screen
- View available trainers
- Trainer profiles

## 🔐 Authentication Flow

1. User opens app
2. App checks SecureStore for JWT token
3. If token exists → Navigate to main app
4. If no token → Show login screen
5. User logs in → Token stored in SecureStore
6. All API requests include JWT in Authorization header
7. Logout → Token removed from SecureStore → Back to login

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and restart
npx expo start --clear
```

### Login fails
1. Check API_BASE_URL in `.env`
2. Verify backend is running
3. Check network connectivity
4. Look for console logs in the Expo terminal

### Type errors
```bash
# Ensure correct package versions
npm install @types/react@~19.1.10 react-native-screens@~4.16.0
```

### "Cannot cast String to Boolean" error
- This was caused by incompatible boolean properties in `app.json`
- Fixed by removing `newArchEnabled` and `edgeToEdgeEnabled`

## 📝 Development Notes

### Code Structure
```
mobile/
├── app/
│   ├── api.ts              # API client and endpoints
│   ├── auth.tsx            # Authentication context
│   ├── navigation.tsx      # Navigation setup
│   └── screens/            # Screen components
│       ├── LoginScreen.tsx
│       ├── ProfileScreen.tsx
│       ├── ClassBookingScreen.tsx
│       ├── MyBookingsScreen.tsx
│       ├── ClassesScreen.tsx
│       ├── TrainersScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── UserDashboardScreen.tsx
│       └── HomeScreen.tsx
├── assets/                 # Images, icons, splash screens
├── App.tsx                 # App entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── Makefile                # Build commands
└── .env                    # Environment variables
```

### Best Practices Implemented
- ✅ TypeScript for type safety
- ✅ Separation of concerns (API, Auth, UI)
- ✅ Secure token storage
- ✅ Error handling and user feedback
- ✅ Loading states
- ✅ Environment-based configuration
- ✅ Clean code and consistent styling
- ✅ Reusable API client
- ✅ Context-based state management

## 🚧 Future Enhancements

- [ ] User registration flow
- [ ] Forgot password functionality
- [ ] Trainer-specific features (schedule management)
- [ ] Push notifications for class reminders
- [ ] Offline support
- [ ] Class search and filters
- [ ] User settings screen
- [ ] Dark mode support
- [ ] Profile image upload
- [ ] Calendar view for bookings
- [ ] Payment integration
- [ ] Social features (reviews, ratings)

## 📄 License

This project is part of the TIM Business Management System.

## 🤝 Contributing

1. Follow TypeScript and React Native best practices
2. Test on both iOS and Android
3. Update documentation for new features
4. Use meaningful commit messages

---

**Last Updated**: October 30, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
