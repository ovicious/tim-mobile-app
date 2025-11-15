import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Classes: undefined;
  Trainers: undefined;
  Profile: undefined;
};

export default function HomeScreen() {
  const { theme } = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createHomeStyles(theme), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>🏋️ Gym App</Text>
      <View style={styles.buttonContainer}>
        <Button 
          theme={theme}
          title="Classes" 
          onPress={() => navigation.navigate('Classes')}
          variant="primary"
          fullWidth
          style={styles.button}
        />
        <Button 
          theme={theme}
          title="Trainers" 
          onPress={() => navigation.navigate('Trainers')}
          variant="secondary"
          fullWidth
          style={styles.button}
        />
        <Button 
          theme={theme}
          title="Profile" 
          onPress={() => navigation.navigate('Profile')}
          variant="secondary"
          fullWidth
        />
      </View>
    </View>
  );
}

function createHomeStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 40, textAlign: 'center' },
    buttonContainer: { width: '100%', gap: 12 },
    button: { marginBottom: 8 },
  });
}
