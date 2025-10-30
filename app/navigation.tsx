import React from 'react';
import { NavigationContainer, DarkTheme as NavDarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import UserDashboardScreen from './screens/UserDashboardScreen';
import ClassesScreen from './screens/ClassesScreen';
import TrainersScreen from './screens/TrainersScreen';
import ProfileScreen from './screens/ProfileScreen';
import ClassBookingScreen from './screens/ClassBookingScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import LoginScreen from './screens/LoginScreen';
import { AuthProvider, useAuth } from './auth';
import { DeviceUiProvider } from './device-ui';
import { theme } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(6, insets.bottom);
  const tabHeight = 56 + insets.bottom;
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="DashboardTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { paddingBottom: bottomPad, height: tabHeight, backgroundColor: theme.colors.tabBg, borderTopColor: theme.colors.border },
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'DashboardTab') iconName = 'home-outline';
          else if (route.name === 'BookClass') iconName = 'calendar-outline';
          else if (route.name === 'MyBookings') iconName = 'list-outline';
          else if (route.name === 'Trainers') iconName = 'barbell-outline';
          else if (route.name === 'Profile') iconName = 'person-circle-outline';
          return <Ionicons name={iconName} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" options={{ title: 'Dashboard' }} component={UserDashboardScreen} />
      <Tab.Screen name="BookClass" options={{ title: 'Book' }} component={ClassBookingScreen} />
      <Tab.Screen name="MyBookings" options={{ title: 'My Bookings' }} component={MyBookingsScreen} />
      <Tab.Screen name="Trainers" component={TrainersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  const navTheme: Theme = {
    ...NavDarkTheme,
    colors: {
      ...NavDarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      primary: theme.colors.primary,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };
  function RootNavigator() {
    const { token, loading } = useAuth();
    if (loading) return null;
    if (!token) {
      return (
        <Stack.Navigator id={undefined}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      );
    }
    return (
      <Stack.Navigator
        id={undefined}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}
      >
        <Stack.Screen name="Root" component={Tabs} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Classes" component={ClassesScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <DeviceUiProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" backgroundColor="#000000" />
            <RootNavigator />
          </NavigationContainer>
        </DeviceUiProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
