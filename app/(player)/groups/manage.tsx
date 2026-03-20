import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import apiService, { GroupResponse } from '../../../services/api';
import useDelayedLoader from '../../../hooks/useDelayedLoader';

export default function ManageGroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  const loadGroups = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const adminGroups = await apiService.getAdminGroups(user.id);
      setGroups(adminGroups);
    } catch (err) {
      console.error('Failed to load admin groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading groups you manage...</Text>
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
        <Ionicons name="settings-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Managed Groups</Text>
        <Text style={styles.emptyText}>You are not an admin of any groups yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerText}>Groups you manage</Text>
      {groups.map((group) => (
        <TouchableOpacity
          key={group.id}
          style={styles.groupCard}
          onPress={() => router.push(`/(player)/groups/manage/${group.id}`)}
        >
          <View style={styles.cardMain}>
            <View style={styles.cardLeft}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.metaText}>{group.season.seasonName}</Text>
              <Text style={styles.metaText}>Team Size: {group.teamSize ?? '-'}</Text>
              <Text style={styles.metaText}>First Scoring Episode: {group.firstScoringEpisodeNumber ?? 1}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
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
  },
  cardMain: {
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
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  metaText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: 2,
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
});
