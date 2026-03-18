import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, useResponsive } from '../../constants/theme';
import { GroupSelector } from './GroupSelector';
import apiService, { GroupResponse } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';

interface PlayerHeaderProps {
  onGroupChange?: (groupId: number) => void;
  showGroupSelector?: boolean;
}

export function PlayerHeader({ onGroupChange, showGroupSelector = true }: PlayerHeaderProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const { user } = useAuth();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const responsive = useResponsive();

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Check if user has ID
        if (!user.id) {
          console.log('User object:', user);
          setError('Please log out and log back in to refresh session');
          setLoading(false);
          return;
        }
        
        console.log('Fetching groups for user ID:', user.id);
        const userGroups = await apiService.getUserGroups(user.id);
        console.log('Fetched groups:', userGroups);
        setGroups(userGroups);
        
        const preferredGroupId =
          selectedGroupId && userGroups.some((group) => group.id === selectedGroupId)
            ? selectedGroupId
            : userGroups[0]?.id ?? null;

        if (preferredGroupId !== null && preferredGroupId !== selectedGroupId) {
          setSelectedGroupId(preferredGroupId);
          onGroupChange?.(preferredGroupId);
        }
        
        // Load pending invitations count
        const invitations = await apiService.getPendingInvitations(user.id);
        setPendingInviteCount(invitations.length);
      } catch (err: any) {
        console.error('Failed to fetch groups:', err);
        setError(err?.message || 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user, selectedGroupId, setSelectedGroupId, onGroupChange]);

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupId(groupId);
    onGroupChange?.(groupId);
  };

  return (
    <View style={[styles.header, responsive.isMobile && styles.mobileHeader]}>
      <View style={styles.headerContent}>
        {/* Left: Group Selector */}
        <View style={styles.leftContent}>
          {showGroupSelector && (
            loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.infoText}>Loading groups...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContent}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.hintText}>Check browser console for details</Text>
              </View>
            ) : groups.length === 0 ? (
              <View style={styles.centerContent}>
                <Text style={styles.infoText}>No groups available</Text>
              </View>
            ) : (
              <GroupSelector
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={handleGroupSelect}
              />
            )
          )}
        </View>

        {/* Right: Notifications & Profile */}
        <View style={styles.rightContent}>
          {/* Notifications Bell */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/(player)/groups/invitations')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
            {pendingInviteCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingInviteCount > 9 ? '9+' : pendingInviteCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Icon */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    overflow: 'visible',
    zIndex: 100,
  },

  mobileHeader: {
    // Mobile-specific adjustments if needed
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },

  leftContent: {
    flex: 1,
    minWidth: 0, // Allows flex children to shrink
  },

  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  iconButton: {
    position: 'relative',
    padding: Spacing.sm,
  },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
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

  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },

  errorText: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },

  hintText: {
    color: Colors.textLight,
    fontSize: 12,
  },

  infoText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
