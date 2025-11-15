import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import UserDashboardScreen from './screens/UserDashboardScreen';
import ClassesScreen from './screens/ClassesScreen';
import TrainersScreen from './screens/TrainersScreen';
import ProfileScreen from './screens/ProfileScreen';
import ClassBookingScreen from './screens/ClassBookingScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';
import SelectGymScreen from './screens/SelectGymScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';
import { AuthProvider, useAuth } from './auth';
import { DeviceUiProvider } from './device-ui';
import { useThemeColors } from './theme';
import { getProfile } from './api';
import { logger } from './utils/logger';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  logger.debug('Tabs', 'Initializing tab navigation');
  const insets = useSafeAreaInsets();
  const { theme } = useThemeColors();
  const [userInfo, setUserInfo] = useState<{ firstName: string; gymName: string } | null>(null);

  useEffect(() => {
    async function loadUserInfo() {
      try {
        logger.debug('Tabs', 'Loading user info');
        const profile = await getProfile();
        const data = profile?.data ?? profile;
        const info = {
          firstName: data?.first_name || 'Profile',
          gymName: data?.business_name || data?.business_id?.substring(0, 8) || 'Gym',
        };
        logger.info('Tabs', 'User info loaded', { firstName: info.firstName, gymName: info.gymName });
        setUserInfo(info);
      } catch (e) {
        logger.warn('Tabs', 'Failed to load user info, using defaults', e);
        setUserInfo({ firstName: 'Profile', gymName: 'Gym' });
      }
    }
    loadUserInfo();
  }, []);

  const bottomPad = Math.max(6, insets.bottom);
  const tabHeight = 56 + insets.bottom;

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          paddingBottom: bottomPad,
          height: tabHeight,
          backgroundColor: theme.colors.tabBg,
          borderTopColor: theme.colors.border,
        },
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={UserDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size ?? 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: userInfo?.firstName || 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size ?? 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Gym"
        component={ClassBookingScreen}
        options={{
          tabBarLabel: userInfo?.gymName || 'Gym',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness-outline" size={size ?? 22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <DeviceUiProvider>
          <NavigationContent />
        </DeviceUiProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function NavigationContent() {
  logger.debug('NavigationContent', 'Initializing navigation with theme');
  const { theme, isDarkMode } = useThemeColors();

  if (!theme || !theme.colors) {
    logger.error('NavigationContent', 'Theme is undefined or missing colors');
    return null; // Don't render if theme is unavailable
  }

  logger.debug('NavigationContent', 'Theme loaded successfully', { isDarkMode });

  const baseNav = isDarkMode ? NavDarkTheme : NavLightTheme;
  const navTheme: Theme = {
    ...baseNav,
    colors: {
      ...baseNav.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      primary: theme.colors.primary,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  function RootNavigator() {
    const { token, loading } = useAuth();
    const insets = useSafeAreaInsets();

    if (loading) {
      logger.debug('RootNavigator', 'Auth loading...');
      return null;
    }

    if (!token) {
      logger.debug('RootNavigator', 'No token, showing auth screens');
      return (
        <Stack.Navigator id={undefined}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SelectGym" component={SelectGymScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      );
    }

    logger.debug('RootNavigator', 'Token found, showing main app');
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Stack.Navigator
          id={undefined}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}
        >
          <Stack.Screen name="Root" component={Tabs} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Classes" component={ClassesScreen} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ headerShown: true, title: 'My Bookings' }} />
          <Stack.Screen name="NewBooking" component={require('./screens/NewBookingScreen').default} options={{ headerShown: true, title: 'New Booking' }} />
          <Stack.Screen name="BookClass" component={require('./screens/ClassBookingScreen').default} options={{ headerShown: true, title: 'Book a Class' }} />
        </Stack.Navigator>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
      <RootNavigator />
    </NavigationContainer>
  );
}
