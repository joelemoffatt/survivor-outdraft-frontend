import { View, Text, StyleSheet } from 'react-native';
import { AppNotification, formatRelativeTime } from '../../types/notifications';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  notification: AppNotification;
}

export default function InfoNotificationCard({ notification }: Props) {
  const isUnread = !notification.read;

  return (
    <View style={[styles.card, isUnread && styles.unread]}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.message}>
            <Text style={styles.bold}>{notification.actorUsername}</Text>
            {' accepted your invite to '}
            <Text style={styles.bold}>{notification.groupName}</Text>
            {'.'}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
        </View>
        {isUnread && <View style={styles.dot} />}
      </View>
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
});
