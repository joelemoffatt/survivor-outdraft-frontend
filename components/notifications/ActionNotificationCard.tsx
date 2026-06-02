import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { AppNotification, formatRelativeTime } from '../../types/notifications';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import apiService from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  notification: AppNotification;
}

export default function ActionNotificationCard({ notification }: Props) {
  const { refreshUnreadCount } = useNotifications();
  const { refreshUserGroups } = useGroup();
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [actioned, setActioned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUnread = !notification.read;

  const handleAccept = async () => {
    if (!notification.invitationId || loading) return;
    setLoading('accept');
    setError(null);
    try {
      await apiService.acceptInvitation(notification.invitationId);
      setActioned(true);
      refreshUnreadCount();
      refreshUserGroups();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setError(msg?.toLowerCase().includes('not found')
        ? 'This invitation is no longer valid.'
        : 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!notification.invitationId || loading) return;
    setLoading('decline');
    setError(null);
    try {
      await apiService.rejectInvitation(notification.invitationId);
      setActioned(true);
      refreshUnreadCount();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setError(msg?.toLowerCase().includes('not found')
        ? 'This invitation is no longer valid.'
        : 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[styles.card, isUnread && styles.unread]}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.message}>
            <Text style={styles.bold}>{notification.actorUsername}</Text>
            {' invited you to join '}
            <Text style={styles.bold}>{notification.groupName}</Text>
            {'.'}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
        </View>
        {isUnread && <View style={styles.dot} />}
      </View>

      {!actioned ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={handleAccept}
            disabled={loading !== null}
          >
            {loading === 'accept' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptText}>Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.declineBtn]}
            onPress={handleDecline}
            disabled={loading !== null}
          >
            {loading === 'decline' ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Text style={styles.declineText}>Decline</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.actionedText}>Response sent</Text>
      )}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  unread: {
    backgroundColor: Colors.warningBackground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  body: {
    flex: 1,
    gap: Spacing.xs,
  },
  message: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
  },
  time: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
  },
  declineBtn: {
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSizes.medium,
  },
  declineText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.medium,
  },
  actionedText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: FontSizes.small,
    color: Colors.error,
  },
});
