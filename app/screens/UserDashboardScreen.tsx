import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button } from '../components';

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

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createDashboardStyles(theme), [theme]);

  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📅 Bookings</Text>
        <View style={styles.row}>
          <Button
            theme={theme}
            title="New Booking"
            onPress={() => navigation.navigate('NewBooking')}
            variant="primary"
            fullWidth
            style={styles.button}
          />
          <Button
            theme={theme}
            title="My Bookings"
            onPress={() => navigation.navigate('MyBookings')}
            variant="secondary"
            fullWidth
            style={styles.button}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🛍️ Shop</Text>
        <Card theme={theme} variant="surface" style={styles.shopCard}>
          <MaterialIcons name="shopping-cart" size={28} color={theme.colors.primary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.shopTitle, { color: theme.colors.text }]}>Browse Shop</Text>
            <Text style={[styles.shopSubtitle, { color: theme.colors.textMuted }]}>Memberships, packages and more</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
        </Card>
      </View>
    </View>
  );
}

function createDashboardStyles(theme: any) {
  return StyleSheet.create({
    containerBase: { flex: 1, padding: 16 },
    section: { marginTop: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12 },
    button: { flex: 1 },
    shopCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    shopTitle: { fontSize: 16, fontWeight: '600' },
    shopSubtitle: { fontSize: 13, marginTop: 4 },
  });
}
