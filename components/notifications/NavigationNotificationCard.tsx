import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppNotification, formatRelativeTime } from '../../types/notifications';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  notification: AppNotification;
}

export default function NavigationNotificationCard({ notification }: Props) {
  const router = useRouter();
  const { setSelectedGroupId, selectedGroupId, refreshGroupData } = useGroup();
  const isUnread = !notification.read;

  const handlePress = () => {
    if (notification.groupId === selectedGroupId) {
      refreshGroupData();
    } else {
      setSelectedGroupId(notification.groupId);
    }
    router.push('/(player)/group');
  };

  return (
    <TouchableOpacity
      style={[styles.card, isUnread && styles.unread]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.message}>
            {'Episode '}
            <Text style={styles.bold}>{notification.episodeNumber}</Text>
            {notification.episodeTitle ? ` – ${notification.episodeTitle}` : ''}
            {' has been scored in '}
            <Text style={styles.bold}>{notification.groupName}</Text>
            {'.'}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
        </View>
        <View style={styles.right}>
          {isUnread && <View style={styles.dot} />}
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
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
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
