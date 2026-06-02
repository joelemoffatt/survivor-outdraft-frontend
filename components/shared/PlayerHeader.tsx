import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Layout, Spacing } from '../../constants/theme';
import { GroupSelector } from './GroupSelector';
import { useGroup } from '../../contexts/GroupContext';
import { useNotifications } from '../../contexts/NotificationContext';

export const PLAYER_HEADER_ROW_HEIGHT = Layout.playerHeaderRowHeight;

export function PlayerHeader() {
  const router = useRouter();
  const { userGroups, selectedGroupId, setSelectedGroupId, groupsLoaded } = useGroup();
  const { unreadCount } = useNotifications();

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupId(groupId);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Left: Group Selector */}
        <View style={styles.leftContent}>
          {groupsLoaded && userGroups.length === 0 ? (
            <Text style={styles.infoText}>No groups</Text>
          ) : (
            <GroupSelector
              groups={userGroups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={handleGroupSelect}
              triggerColor="#fff"
              disabled={!groupsLoaded}
            />
          )}
        </View>

        {/* Right: Notifications & Profile */}
        <View style={styles.rightContent}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(player)/notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    zIndex: 100,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
    gap: Spacing.md,
    height: PLAYER_HEADER_ROW_HEIGHT,
  },

  leftContent: {
    flex: 1,
    minWidth: 0,
  },

  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  iconButton: {
    position: 'relative',
    padding: Spacing.sm,
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.warning,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});
