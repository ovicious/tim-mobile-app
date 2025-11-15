import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button, Card } from '../components';
import { useAuth } from '../auth';

export default function PendingApprovalScreen({ route, navigation }: any) {
  const { logout } = useAuth();
  const { theme } = useThemeColors();
  const businessName = route.params?.businessName || 'the gym';

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createPendingStyles(theme), [theme]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>Approval Pending</Text>
        
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          Your membership request for{' '}
          <Text style={[styles.businessName, { color: theme.colors.primary }]}>{businessName}</Text>
          {' '}has been sent to the gym administrators.
        </Text>

        <Text style={[styles.submessage, { color: theme.colors.textMuted }]}>
          You will receive an email notification once your account has been approved. 
          After approval, you'll be able to login and access all features.
        </Text>

        <Card theme={theme} variant="default" style={styles.infoBox}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>What happens next?</Text>
          <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
            • Gym admins will review your request{'\n'}
            • You'll receive an email when approved{'\n'}
            • Login with your credentials after approval
          </Text>
        </Card>

        <Button
          theme={theme}
          title="Logout"
          onPress={handleLogout}
          variant="secondary"
          fullWidth
          style={styles.logoutButton}
        />
      </View>
    </View>
  );
}

function createPendingStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 24, paddingTop: 80, alignItems: 'center' },
    iconContainer: { marginBottom: 24 },
    icon: { fontSize: 72 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    message: { fontSize: 16, textAlign: 'center', marginBottom: 12, lineHeight: 24 },
    businessName: { fontWeight: '700' },
    submessage: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    infoBox: { width: '100%', marginBottom: 24 },
    infoTitle: { fontWeight: '700', marginBottom: 12 },
    infoText: { fontSize: 14, lineHeight: 22 },
    logoutButton: { width: '100%' },
  });
}
