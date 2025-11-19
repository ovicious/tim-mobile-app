import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button } from '../components';
import { TopBanner, ShopSection } from '../components/dashboard';
import { getProfile } from '../api';
import { getGymName } from '../utils/gymUtils';

type RootStackParamList = {
  Dashboard: undefined;
  Home: undefined;
  Classes: undefined;
  Trainers: undefined;
  Profile: undefined;
  BookClass: undefined;
  MyBookings: undefined;
  NewBooking: undefined;
};

export default function UserDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const [firstName, setFirstName] = useState('');
  const [gymName, setGymName] = useState('');

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createDashboardStyles(theme), [theme]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const data = profile?.data ?? profile;
        setFirstName(data?.first_name || data?.firstName || '');
        setGymName(getGymName(profile));
      } catch {}
    })();
  }, []);

  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      {/* Top banner and notifications */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <TopBanner theme={theme} />
        <TouchableOpacity
          accessibilityLabel="Notifications"
          onPress={() => navigation.navigate('Notifications' as any)}
          style={styles.notificationsBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="notifications-none" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* User + Gym */}
      <View style={styles.userGymWrap}>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>Hi{firstName ? `, ${firstName}` : ''}</Text>
        {!!gymName && (
          <TouchableOpacity onPress={() => navigation.navigate('Gym' as any)}>
            <Text style={[styles.gymName, { color: theme.colors.primary }]}>{gymName}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📅 Bookings</Text>
        <View style={styles.row}>
          <Button
            theme={theme}
            title="New Booking"
            onPress={() => navigation.navigate('ClassBooking' as any)}
            variant="primary"
            fullWidth
            style={styles.button}
          />
          <Button
            theme={theme}
            title="My Booking"
            onPress={() => navigation.navigate('MyBookings')}
            variant="secondary"
            fullWidth
            style={styles.button}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ShopSection
          theme={theme}
          onPressMembership={() => navigation.navigate('Subscriptions' as any)}
          onPressVouchers={() => navigation.navigate('Vouchers' as any)}
          onPressTickets={() => navigation.navigate('Tickets' as any)}
          onPressCredit={() => navigation.navigate('Credit' as any)}
        />
      </View>
    </View>
  );
}

function createDashboardStyles(theme: any) {
  return StyleSheet.create({
    containerBase: { flex: 1, padding: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    notificationsBtn: { padding: 6, marginLeft: 8 },
    userGymWrap: { marginTop: 8, marginBottom: 12 },
    greeting: { fontSize: 22, fontWeight: '800' },
    gymName: { fontSize: 14, fontWeight: '700' },
    section: { marginTop: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12 },
    button: { flex: 1 },
  });
}
