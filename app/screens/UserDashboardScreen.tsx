import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';

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
  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bookings</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.cta, { backgroundColor: theme.colors.success }]} onPress={() => navigation.navigate('NewBooking')}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>New Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cta, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('MyBookings')}>
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Shop</Text>
        <TouchableOpacity style={[styles.shopCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="cart-outline" size={28} color={theme.colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.shopTitle, { color: theme.colors.text }]}>Browse Shop</Text>
            <Text style={[styles.shopSubtitle, { color: theme.colors.textMuted }]}>Memberships, packages and more</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerBase: { flex: 1, padding: 16 },
  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  ctaText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  shopCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  shopTitle: { fontSize: 16, fontWeight: '600' },
  shopSubtitle: { fontSize: 13 },
});
