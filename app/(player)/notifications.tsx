import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../../types/notifications';
import NotificationCard from '../../components/notifications/NotificationCard';
import apiService from '../../services/api';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationsScreen() {
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAndMarkRead = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
      // Mark all read in background; badge update follows
      await apiService.markAllNotificationsRead();
      refreshUnreadCount();
    } catch {
      // fail silently — stale list is acceptable
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      loadAndMarkRead();
    }, [loadAndMarkRead])
  );

if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="notifications-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptySubtitle}>You're all caught up.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <NotificationCard notification={item} />
      )}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  list: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
});
