import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { GroupResponse } from '../../../services/api';
import useDelayedLoader from '../../../hooks/useDelayedLoader';

export default function SelectGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

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
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

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
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.seasonText}>{group.season.seasonName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(group.status) + '20' }]}>
              <Ionicons
                name={getStatusIcon(group.status) as any}
                size={12}
                color={getStatusColor(group.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(group.status) }]}>
                {group.status}
              </Text>
            </View>
          </View>
          {selectedGroupId === group.id && <View style={styles.selectedIndicator} />}
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
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  groupName: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  seasonText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
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