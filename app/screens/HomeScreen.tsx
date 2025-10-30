import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Classes: undefined;
  Trainers: undefined;
  Profile: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gym App</Text>
      <Button title="Classes" onPress={() => navigation.navigate('Classes')} />
      <Button title="Trainers" onPress={() => navigation.navigate('Trainers')} />
      <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  title: { fontSize: 24, marginBottom: 24, color: theme.colors.text },
});
