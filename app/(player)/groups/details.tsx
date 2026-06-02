import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppLoader from '../../../components/shared/AppLoader';
import { Stack, useRouter } from 'expo-router';
import EmptyState from '../../../components/shared/EmptyState';
import { getLocalRuleLabel } from '../../../components/admin/GroupRulesEditor';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import { GroupResponse } from '../../../services/api';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../constants/theme';
import useDelayedLoader from '../../../hooks/useDelayedLoader';
import AvatarCircle from '../../../components/shared/AvatarCircle';

type Tab = 'details' | 'draft' | 'scoring' | 'members';

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'draft', label: 'Draft' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'members', label: 'Members' },
];

const draftStyleLabels: Record<string, string> = {
  SNAKE: 'Snake',
  ROUND_ROBIN: 'Round Robin',
  LINEAR: 'Linear',
};

const formatGroupStatus = (status?: GroupResponse['status']) => {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'PENDING': return 'Pending';
    case 'DRAFTING': return 'Drafting';
    case 'COMPLETED': return 'Completed';
    default: return 'Unknown';
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, groupData } = useGroup();
  const { group, members, loading, error } = groupData;
  const showLoadingSpinner = useDelayedLoader(loading, 200);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  const sortedRules = useMemo(
    () =>
      [...(group?.pointRules ?? [])].sort((a, b) =>
        getLocalRuleLabel(a.ruleType).localeCompare(getLocalRuleLabel(b.ruleType))
      ),
    [group?.pointRules]
  );

  const headerTitle = group?.name ?? 'Group Details';

  if (loading) {
    if (!showLoadingSpinner) {
      return (
        <>
          <Stack.Screen options={{ title: headerTitle }} />
          <View style={styles.container} />
        </>
      );
    }
    return (
      <>
        <Stack.Screen options={{ title: headerTitle }} />
        <AppLoader />
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
      <View style={styles.container}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <InfoRow label="Group Name" value={group.name} />
              <InfoRow label="Status" value={formatGroupStatus(group.status)} />
              <InfoRow label="Admin" value={group.admin.username} />
              <InfoRow label="Season" value={group.season.seasonName || `Survivor ${group.season.id}`} />
              <InfoRow label="Created" value={formatDateTime(group.createdAt)} />
            </View>
          </ScrollView>
        )}

        {/* Draft Tab */}
        {activeTab === 'draft' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <InfoRow label="Draft Style" value={draftStyleLabels[group.draft?.style ?? 'SNAKE'] ?? 'Snake'} />
              <InfoRow label="Team Size" value={group.draft?.teamSize != null ? `${group.draft.teamSize}` : 'Not set'} />
              <InfoRow label="Scheduled Date" value={formatDateTime(group.draft?.scheduledAt)} />
              <InfoRow
                label="Latest Episode Watched"
                value={
                  group.latestEpisodeWatched
                    ? `Episode ${group.latestEpisodeWatched.episodeNumber}${group.latestEpisodeWatched.episodeTitle ? ` — ${group.latestEpisodeWatched.episodeTitle}` : ''}`
                    : 'None'
                }
              />
            </View>
          </ScrollView>
        )}

        {/* Scoring Tab */}
        {activeTab === 'scoring' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <InfoRow label="First Scoring Episode" value={`Episode ${group.firstScoringEpisodeNumber ?? 1}`} />
            </View>
            <View style={styles.card}>
              {sortedRules.length > 0 ? (
                sortedRules.map((rule) => (
                  <InfoRow
                    key={rule.ruleType}
                    label={getLocalRuleLabel(rule.ruleType)}
                    value={`${rule.points > 0 ? '+' : ''}${rule.points} pts`}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No scoring rules configured.</Text>
              )}
            </View>
          </ScrollView>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.card}>
              {members.length === 0 ? (
                <Text style={styles.emptyText}>No members yet.</Text>
              ) : (
                members.map((m, index) => {
                  const isAdminMember = m.user.id === group.admin.id;
                  const statusBadge =
                    m.status === 'ACCEPTED' ? styles.statusBadgeActive :
                    m.status === 'INVITED' ? styles.statusBadgePending :
                    styles.statusBadgeDeclined;
                  const statusText =
                    m.status === 'ACCEPTED' ? styles.statusTextActive :
                    m.status === 'INVITED' ? styles.statusTextPending :
                    styles.statusTextDeclined;
                  const statusLabel =
                    m.status === 'ACCEPTED' ? 'Joined' :
                    m.status === 'INVITED' ? 'Invited' : 'Declined';
                  return (
                    <View
                      key={m.id}
                      style={[styles.memberRow, index < members.length - 1 && styles.memberRowBorder]}
                    >
                      <AvatarCircle size={36} fallbackText={m.user.username} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{m.user.username}</Text>
                        {isAdminMember && <Text style={styles.adminLabel}>Admin</Text>}
                      </View>
                      <View style={[styles.statusBadge, statusBadge]}>
                        <Text style={[styles.statusText, statusText]}>{statusLabel}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: Colors.primary,
  },

  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },

  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
  },
  adminLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  statusBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  statusBadgeActive: { backgroundColor: Colors.successBackground },
  statusTextActive: { color: Colors.success },
  statusBadgePending: { backgroundColor: Colors.warningBackground },
  statusTextPending: { color: Colors.primary },
  statusBadgeDeclined: { backgroundColor: Colors.lightBackground },
  statusTextDeclined: { color: Colors.textSecondary },
});
