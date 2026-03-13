import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Chip from '../../../components/shared/Chip';
import EmptyState from '../../../components/shared/EmptyState';
import FormButton from '../../../components/shared/FormButton';
import { DetailRow, DetailsSection } from '../../../components/shared/DetailsSection';
import { getLocalRuleLabel } from '../../../components/admin/GroupRulesEditor';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { GroupResponse } from '../../../services/api';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

const draftStyleLabels: Record<string, string> = {
  SNAKE: 'Snake',
  ROUND_ROBIN: 'Round Robin',
  LINEAR: 'Linear',
};

const getStatusVariant = (status: GroupResponse['status']) => {
  switch (status) {
    case 'ACTIVE':
      return 'success' as const;
    case 'PENDING':
      return 'warning' as const;
    case 'DRAFTING':
      return 'primary' as const;
    case 'COMPLETED':
    default:
      return 'default' as const;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId } = useGroup();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      if (!selectedGroupId) {
        setGroup(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const groupData = await apiService.getGroupById(selectedGroupId);
        setGroup(groupData);
      } catch (err) {
        console.error('Failed to load group details:', err);
        setGroup(null);
        setError(err instanceof Error ? err.message : 'Failed to load group details.');
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [selectedGroupId]);

  const sortedRules = useMemo(
    () =>
      [...(group?.pointRules ?? [])].sort((a, b) =>
        getLocalRuleLabel(a.ruleType).localeCompare(getLocalRuleLabel(b.ruleType))
      ),
    [group?.pointRules]
  );

  const isAdmin = Boolean(group && user && group.admin.id === user.id);
  const headerTitle = group?.name ?? 'Group Details';

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: headerTitle }} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </>
    );
  }

  if (!selectedGroupId) {
    return (
      <>
        <Stack.Screen options={{ title: headerTitle }} />
        <EmptyState
          icon="people-outline"
          title="No Group Selected"
          message="Choose a group first to view its details."
          actionLabel="Select Group"
          onAction={() => router.push('/(player)/groups/select')}
        />
      </>
    );
  }

  if (error || !group) {
    return (
      <>
        <Stack.Screen options={{ title: headerTitle }} />
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to Load Group"
          message={error ?? 'The selected group could not be loaded.'}
          actionLabel="Try Again"
          onAction={() => router.replace('/(player)/groups/details')}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: headerTitle }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <DetailsSection title="Overview" subtitle="Core group information and current status.">
        <DetailRow label="Group Name" value={group.name} />
        <DetailRow
          label="Status"
          value={<Chip label={group.status} variant={getStatusVariant(group.status)} />}
        />
        <DetailRow label="Admin" value={group.admin.username} />
        <DetailRow label="Season" value={group.season.seasonName || `Survivor ${group.season.id}`} />
        <DetailRow label="Created" value={formatDateTime(group.createdAt)} noBorder />
      </DetailsSection>

      <DetailsSection
        title="Draft & Scoring Settings"
        subtitle="These values control drafting flow, spoiler filtering, and scoring eligibility."
      >
        <DetailRow label="Draft Style" value={draftStyleLabels[group.draft?.style ?? 'SNAKE'] ?? 'Snake'} />
        <DetailRow label="Team Size" value={group.teamSize != null ? `${group.teamSize}` : 'Not set'} />
        <DetailRow
          label="Latest Episode Watched"
          value={
            group.latestEpisodeWatched
              ? `Episode ${group.latestEpisodeWatched.episodeNumber}${group.latestEpisodeWatched.episodeTitle ? ` - ${group.latestEpisodeWatched.episodeTitle}` : ''}`
              : "Haven't watched any episodes"
          }
          helperText="Used to hide spoilers for later boots and events."
        />
        <DetailRow
          label="First Scoring Episode"
          value={`Episode ${group.firstScoringEpisodeNumber ?? 1}`}
          helperText="Events before this episode do not count toward team points."
        />
        <DetailRow
          label="Draft Scheduled"
          value={formatDateTime(group.draft?.scheduledAt)}
          noBorder
        />
      </DetailsSection>

      <DetailsSection
        title="Scoring Rules"
        subtitle="Active rules and the point values used for this group."
      >
        {sortedRules.length > 0 ? (
          sortedRules.map((rule, index) => (
            <DetailRow
              key={rule.ruleType}
              label={getLocalRuleLabel(rule.ruleType)}
              value={`${rule.points > 0 ? '+' : ''}${rule.points} pts`}
              noBorder={index === sortedRules.length - 1}
            />
          ))
        ) : (
          <DetailRow
            label="Rules"
            value="No scoring rules configured"
            helperText="This group will not award points until rules are added."
            noBorder
          />
        )}
      </DetailsSection>

        {isAdmin ? (
          <FormButton
            title="Edit Group Settings"
            onPress={() => router.push(`/(player)/groups/manage/${group.id}`)}
            style={styles.actionButton}
          />
        ) : null}
      </ScrollView>
    </>
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
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  actionButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
