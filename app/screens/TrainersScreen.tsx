import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { apiGet } from '../api';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card } from '../components';

export default function TrainersScreen() {
  const { theme } = useThemeColors();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createTrainerStyles(theme), [theme]);

  useEffect(() => {
    apiGet('/api/v1/trainers')
      .then((data) => {
        setTrainers(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => setTrainers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator style={[styles.container, { backgroundColor: theme.colors.background }]} color={theme.colors.primary} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>👨‍🏫 Trainers</Text>
      <FlatList
        data={trainers}
        keyExtractor={(item) => item.trainer_id || item.id || Math.random().toString()}
        contentContainerStyle={trainers.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No trainers found</Text>
        }
        renderItem={({ item }) => (
          <Card theme={theme} variant="default" style={styles.item}>
            <Text style={[styles.itemText, { color: theme.colors.text }]}>{item.name || 'Unknown'}</Text>
            {item.specialty && (
              <Text style={[styles.specialty, { color: theme.colors.textMuted }]}>{item.specialty}</Text>
            )}
          </Card>
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

function createTrainerStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    item: { marginBottom: 12 },
    itemText: { fontWeight: '600', fontSize: 16 },
    specialty: { fontSize: 12, marginTop: 4 },
    emptyContainer: { justifyContent: 'center', alignItems: 'center', minHeight: 200 },
    emptyText: { fontSize: 16 },
  });
}
