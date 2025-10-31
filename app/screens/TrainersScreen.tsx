import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { apiGet } from '../api';
import { theme } from '../theme';

export default function TrainersScreen() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet('/api/v1/trainers')
      .then(setTrainers)
      .catch(() => setTrainers([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trainers</Text>
      <FlatList
        data={trainers}
        keyExtractor={item => item.trainer_id || item.id}
        renderItem={({ item }) => (
          <View style={styles.item}><Text style={styles.itemText}>{item.name}</Text></View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, marginBottom: 16, color: theme.colors.text },
  item: { padding: 12, borderBottomWidth: 1, borderColor: theme.colors.border },
  itemText: { color: theme.colors.text },
});
