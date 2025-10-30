import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { apiGet } from '../api';

export default function ClassesScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet('/api/v1/classes')
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classes</Text>
      <FlatList
        data={classes}
        keyExtractor={item => item.class_id || item.id}
        renderItem={({ item }) => (
          <View style={styles.item}><Text>{item.name}</Text></View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
});
