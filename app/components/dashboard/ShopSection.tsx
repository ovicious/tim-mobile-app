import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme/types';

type CardItem = {
  key: 'membership' | 'vouchers' | 'tickets' | 'credit';
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
};

interface Props {
  theme: AppTheme;
  onPressMembership: () => void;
  onPressVouchers: () => void;
  onPressTickets: () => void;
  onPressCredit: () => void;
}

export const ShopSection: React.FC<Props> = ({ theme, onPressMembership, onPressVouchers, onPressTickets, onPressCredit }) => {
  const items: CardItem[] = [
    { key: 'membership', title: 'Membership', icon: 'workspace-premium', onPress: onPressMembership },
    { key: 'vouchers', title: 'Vouchers', icon: 'redeem', onPress: onPressVouchers },
    { key: 'tickets', title: 'Tickets', icon: 'confirmation-number', onPress: onPressTickets },
    { key: 'credit', title: 'Credit', icon: 'account-balance-wallet', onPress: onPressCredit },
  ];

  const styles = StyleSheet.create({
    sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 12, marginTop: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    card: {
      width: '48%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary + '15',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
  });

  return (
    <View>
      <Text style={styles.sectionTitle}>🛍️ Shop</Text>
      <View style={styles.grid}>
        {items.map((it) => (
          <TouchableOpacity key={it.key} onPress={it.onPress} activeOpacity={0.8}>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <MaterialIcons name={it.icon} size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>{it.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
