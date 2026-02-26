import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
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
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { setSelectedGroupId: setContextGroupId } = useGroup();
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
        
        // Auto-select first group if available
        if (userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
          setContextGroupId(userGroups[0].id);
          onGroupChange?.(userGroups[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch groups:', err);
        setError(err?.message || 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupId(groupId);
    setContextGroupId(groupId);
    onGroupChange?.(groupId);
  };

  return (
    <View style={[styles.header, responsive.isMobile && styles.mobileHeader]}>
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
