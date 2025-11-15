import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button } from '../components';

type RootStackParamList = {
  Home: undefined;
  Classes: undefined;
  Trainers: undefined;
  Profile: undefined;
};

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();

  const sharedStyles = React.useMemo(() => createSharedStyles(theme), [theme]);

  const styles = React.useMemo(() =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
        justifyContent: 'center',
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        color: theme.colors.text,
        textAlign: 'center',
      },
      cardContent: {
        alignItems: 'center',
        gap: 8,
      },
      cardText: {
        fontSize: 18,
        color: theme.colors.primary,
        fontWeight: '500',
      },
    }),
    [theme]
  );

  const handleNavigate = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your Gym Dashboard</Text>

      <Card theme={theme} style={{ marginVertical: 12 }}>
        <TouchableOpacity
          onPress={() => handleNavigate('Profile')}
          style={styles.cardContent}
        >
          <Text style={styles.cardText}>👤 Profile</Text>
        </TouchableOpacity>
      </Card>

      <Card theme={theme} style={{ marginVertical: 12 }}>
        <TouchableOpacity
          onPress={() => handleNavigate('Classes')}
          style={styles.cardContent}
        >
          <Text style={styles.cardText}>📚 Book a Class</Text>
        </TouchableOpacity>
      </Card>

      <Card theme={theme} style={{ marginVertical: 12 }}>
        <TouchableOpacity
          onPress={() => handleNavigate('Trainers')}
          style={styles.cardContent}
        >
          <Text style={styles.cardText}>🏋️ Trainers</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}
