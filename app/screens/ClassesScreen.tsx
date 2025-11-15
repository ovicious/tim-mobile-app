import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiGet } from '../api';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Badge } from '../components';

interface Class {
  class_id?: string;
  id?: string;
  name: string;
  instructor_name?: string;
  start_time?: string;
  capacity?: number;
  booked?: number;
}

type RootStackParamList = {
  NewBooking: { classId: string };
  [key: string]: undefined | object;
};

export default function ClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const sharedStyles = React.useMemo(() => createSharedStyles(theme), [theme]);

  const styles = React.useMemo(() =>
    StyleSheet.create({
      container: {
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: theme.colors.text,
      },
      listContent: {
        paddingBottom: 16,
      },
      classItem: {
        gap: 8,
      },
      classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      },
      className: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
      },
      classDetails: {
        gap: 4,
        marginTop: 8,
      },
      detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      detailText: {
        fontSize: 13,
        color: theme.colors.textMuted,
      },
      bookingInfo: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 8,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      emptyText: {
        fontSize: 16,
        color: theme.colors.textMuted,
      },
    }),
    [theme]
  );

  useEffect(() => {
    apiGet('/api/v1/classes')
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View
        style={[styles.container, styles.emptyContainer]}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const renderClass = ({ item }: { item: Class }) => {
    const classId = item.class_id || item.id || '';
    const booked = item.booked || 0;
    const capacity = item.capacity || 0;
    const isAvailable = booked < capacity;

    return (
      <Card theme={theme} style={{ marginVertical: 8 }}>
        <TouchableOpacity onPress={() => navigation.navigate('NewBooking' as any, { classId })}>
          <View style={styles.classItem}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{item.name}</Text>
              <Badge
                theme={theme}
                text={isAvailable ? 'Available' : 'Full'}
                variant={isAvailable ? 'success' : 'error'}
              />
            </View>

            {item.instructor_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>👤 {item.instructor_name}</Text>
              </View>
            )}

            {item.start_time && (
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>🕐 {new Date(item.start_time).toLocaleString()}</Text>
              </View>
            )}

            {item.capacity && (
              <Text style={styles.bookingInfo}>
                {booked}/{capacity} members booked
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (classes.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No classes available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Classes</Text>
      <FlatList
        data={classes}
        keyExtractor={item => item.class_id || item.id || Math.random().toString()}
        renderItem={renderClass}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}
