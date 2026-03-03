import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { GroupResponse } from '../../../services/api';

export default function SelectGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userGroups = await apiService.getUserGroups(user.id);
      setGroups(userGroups);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'DRAFTING':
        return '#4A90E2';
      case 'ACTIVE':
        return '#4CAF50';
      case 'COMPLETED':
        return '#9E9E9E';
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'time-outline';
      case 'DRAFTING':
        return 'create-outline';
      case 'ACTIVE':
        return 'checkmark-circle-outline';
      case 'COMPLETED':
        return 'flag-outline';
      default:
        return 'help-circle-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.warning} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGroups}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="people-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Groups Yet</Text>
        <Text style={styles.emptyText}>You haven't joined any groups.</Text>
        <Text style={styles.emptyText}>Create a group or accept an invitation to get started!</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(player)/groups/create')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerText}>
        Select which group you want to view
      </Text>

      {groups.map((group) => (
        <TouchableOpacity
          key={group.id}
          style={[
            styles.groupCard,
            selectedGroupId === group.id && styles.selectedCard,
          ]}
          onPress={() => handleSelectGroup(group.id)}
        >
          <View style={styles.groupHeader}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupName}>{group.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(group.status) + '20' }]}>
              <Ionicons
                name={getStatusIcon(group.status) as any}
                size={14}
                color={getStatusColor(group.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(group.status) }]}>
                {group.status}
              </Text>
            </View>
          </View>

          <View style={styles.groupInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="tv-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{group.season.seasonName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Admin: {group.admin.username}</Text>
            </View>
            {group.teamSize && (
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Team Size: {group.teamSize}</Text>
              </View>
            )}
            {group.draftDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  Draft: {new Date(group.draftDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  headerText: {
    fontSize: FontSizes.large,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: '#f8f9ff',
  },
  groupHeader: {
    marginBottom: Spacing.md,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  groupName: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  groupInfo: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.medium,
    color: Colors.warning,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
});