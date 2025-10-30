import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
type RootStackParamList = {
  Dashboard: undefined;
  Home: undefined;
  Classes: undefined;
  Trainers: undefined;
  Profile: undefined;
  BookClass: undefined;
};

export default function UserDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Member Dashboard</Text>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.cardText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BookClass')}>
        <Text style={styles.cardText}>Book a Class</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Trainers')}>
        <Text style={styles.cardText}>Trainers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginVertical: 12,
    width: '80%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '500',
  },
});
