import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { GroupSelector } from './GroupSelector';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';

export const PLAYER_HEADER_ROW_HEIGHT = 59;

export function PlayerHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { userGroups, selectedGroupId, setSelectedGroupId, groupsLoaded } = useGroup();
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    apiService.getPendingInvitations(user.id)
      .then((invites) => setPendingInviteCount(invites.length))
      .catch(() => {});
  }, [user?.id]);

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
            {pendingInviteCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingInviteCount > 9 ? '9+' : pendingInviteCount}
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
