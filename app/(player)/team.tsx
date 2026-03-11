import { Alert, View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useResponsive, Colors, Spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import apiService, { TeamResponse, GroupResponse } from '../../services/api';
import DraftScreen from '../../components/player/DraftScreen';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

export default function TeamScreen() {
  const responsive = useResponsive();
  const { user } = useAuth();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [allTeams, setAllTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [startingDraft, setStartingDraft] = useState(false);
  const [draftComplete, setDraftComplete] = useState(false);
  const [selectingGroup, setSelectingGroup] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resettingDraft, setResettingDraft] = useState(false);
  const isGroupLeader = user ? Number(user.id) === Number(group?.admin?.id) : false;

  // Auto-select first group if none selected
  useEffect(() => {
    if (selectedGroupId || !user || selectingGroup) {
      return;
    }

    setSelectingGroup(true);
    const autoSelectGroup = async () => {
      try {
        const userGroups = await apiService.getUserGroups(user.id);
        if (userGroups.length > 0) {
          setSelectedGroupId(userGroups[0].id);
        }
      } catch (err) {
        console.error('Failed to auto-select group:', err);
      } finally {
        setSelectingGroup(false);
      }
    };

    autoSelectGroup();
  }, [user, selectedGroupId, selectingGroup, setSelectedGroupId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedGroupId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch group info
        const groupData = await apiService.getGroupById(selectedGroupId);
        setGroup(groupData);
        
        // Fetch team data
        const teamData = await apiService.getTeamByGroupAndUser(selectedGroupId, user.id);
        setTeam(teamData);

        // Fetch all teams in the group
        const teamsData = await apiService.getTeamsByGroupId(selectedGroupId);
        setAllTeams(teamsData);

        // Reset draftComplete if draft is still in progress
        if (groupData.status === 'DRAFTING') {
          setDraftComplete(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedGroupId]);

  // Countdown timer for draft start
  useEffect(() => {
    const scheduledAt = group?.draft?.scheduledAt;
    if (!group || !scheduledAt || group.status !== 'PENDING') {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const startTime = new Date(scheduledAt);
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Draft should start soon!');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [group]);

  // Poll for draft status changes while draft is PENDING
  useEffect(() => {
    if (!group || group.status !== 'PENDING' || !selectedGroupId) {
      return;
    }

    const pollDraftStatus = async () => {
      try {
        const updatedGroup = await apiService.getGroupById(selectedGroupId);
        
        // If status changed from PENDING to DRAFTING, update state
        if (updatedGroup.status !== 'PENDING' && group.status === 'PENDING') {
          setGroup(updatedGroup);
        }
      } catch (err) {
        // Silently handle polling errors to avoid spam in console
        console.debug('Draft status poll failed:', err);
      }
    };

    // Poll every 3 seconds while waiting for draft
    const pollInterval = setInterval(pollDraftStatus, 3000);
    return () => clearInterval(pollInterval);
  }, [group, selectedGroupId]);

  const handleStartDraft = async () => {
    if (!selectedGroupId) return;
    
    try {
      setStartingDraft(true);
      await apiService.startDraft(selectedGroupId);
      
      // Refresh group data
      const groupData = await apiService.getGroupById(selectedGroupId);
      setGroup(groupData);
    } catch (err: any) {
      console.error('Failed to start draft:', err);
      alert('Failed to start draft: ' + (err?.message || 'Unknown error'));
    } finally {
      setStartingDraft(false);
    }
  };

  const handleResetDraft = () => {
    if (!selectedGroupId || resettingDraft) return;
    setResetModalVisible(true);
  };

  const confirmResetDraft = async () => {
    if (!selectedGroupId) return;

    try {
      setResetModalVisible(false);
      setResettingDraft(true);
      await apiService.resetDraft(selectedGroupId);

      const groupData = await apiService.getGroupById(selectedGroupId);
      setGroup(groupData);
      setDraftComplete(false);

      if (user) {
        const teamData = await apiService.getTeamByGroupAndUser(selectedGroupId, user.id);
        setTeam(teamData);
      }

      const teamsData = await apiService.getTeamsByGroupId(selectedGroupId);
      setAllTeams(teamsData);
    } catch (err: any) {
      console.error('Failed to reset draft:', err);
      Alert.alert('Reset failed', err?.message || 'Unknown error');
    } finally {
      setResettingDraft(false);
    }
  };

  if (!selectedGroupId) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading groups...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!team || !group) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No team found for this group</Text>
      </View>
    );
  }

  // BEFORE DRAFT - Show countdown
  if (group.status === 'PENDING') {
    const isAdmin = isGroupLeader;
    
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.teamName}>{team.teamName}</Text>
          <Text style={styles.draftStatusLabel}>Draft Not Started</Text>
        </View>

        <View style={styles.draftInfoCard}>
          <Text style={styles.draftInfoTitle}>Draft Coming Soon!</Text>
          
          {group.draft?.scheduledAt && (
            <View style={styles.countdownSection}>
              <Text style={styles.countdownLabel}>Draft starts in:</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownSubtext}>
                {new Date(group.draft.scheduledAt).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.draftDetailsSection}>
            <View style={styles.draftDetail}>
              <Text style={styles.draftDetailLabel}>Team Size</Text>
              <Text style={styles.draftDetailValue}>{group.teamSize || '?'} players</Text>
            </View>
            <View style={styles.draftDetail}>
              <Text style={styles.draftDetailLabel}>Season</Text>
              <Text style={styles.draftDetailValue}>{group.season.seasonName}</Text>
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity 
              style={[styles.startButton, startingDraft && styles.startButtonDisabled]}
              onPress={handleStartDraft}
              disabled={startingDraft}
            >
              {startingDraft ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startButtonText}>Start Draft Now</Text>
              )}
            </TouchableOpacity>
          )}

          {!isAdmin && (
            <Text style={styles.adminNote}>
              The draft will be started by {group.admin.username}
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  // DURING DRAFT - Show draft UI
  if (group.status === 'DRAFTING' && !draftComplete) {
    return (
      <DraftScreen
        groupId={selectedGroupId}
        teamSize={group.teamSize || 5}
        onDraftComplete={async () => {
          try {
            // Refresh group + team data when draft completes
            const groupData = await apiService.getGroupById(selectedGroupId);
            setGroup(groupData);

            if (user) {
              const teamData = await apiService.getTeamByGroupAndUser(selectedGroupId, user.id);
              setTeam(teamData);
            }

            // Fetch all teams in the group
            const teamsData = await apiService.getTeamsByGroupId(selectedGroupId);
            setAllTeams(teamsData);

            setDraftComplete(true);
          } catch (err: any) {
            console.error('Failed to refresh team after draft complete:', err);
            setError(err?.message || 'Failed to refresh team data');
          }
        }}
      />
    );
  }

  // AFTER DRAFT - Show your team and all teams in the group
  return (
    <>
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      {/* Your Team */}
      <View style={styles.headerSection}>
        <Text style={styles.teamName}>Your Team: {team.teamName}</Text>
        {/* Hiding points for now - not working yet */}
        {/* <Text style={styles.totalPointsLabel}>Total Points</Text>
        <Text style={styles.totalPoints}>{team.totalPoints}</Text> */}
      </View>

      <View style={styles.rosterSection}>
        <Text style={styles.sectionTitle}>Your Roster</Text>
        {team.roster && team.roster.length > 0 ? (
          <View>
            {team.roster
              .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
              .map((teamCastaway) => {
                const castawayName = teamCastaway.castawayPerformance?.castaway?.name || 'Unknown';
                return (
                  <View key={teamCastaway.id} style={styles.rosterItem}>
                    <View style={styles.castawayInfo}>
                      <Text style={styles.draftOrder}>
                        {teamCastaway.draftOrder ? `Pick #${teamCastaway.draftOrder}` : 'N/A'}
                      </Text>
                      <Text style={styles.castawayName}>{castawayName}</Text>
                    </View>
                    {/* <View style={styles.pointsDisplay}>
                      <Text style={styles.points}>{teamCastaway.points}</Text>
                      <Text style={styles.pointsLabel}>pts</Text>
                    </View> */}
                  </View>
                );
              })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No castaways on roster</Text>
        )}
      </View>

      {/* All Teams in Group */}
      <View style={styles.groupTeamsSection}>
        <Text style={styles.sectionTitle}>All Teams in {group.name}</Text>
        {allTeams.map((t) => (
          <View key={t.id} style={[styles.teamCard, t.id === team.id && styles.yourTeamCard]}>
            <View style={styles.teamCardHeader}>
              <Text style={styles.teamCardName}>
                {t.teamName} {t.id === team.id && '(You)'}
              </Text>
              <Text style={styles.teamRosterCount}>
                {t.roster?.length || 0} players
              </Text>
            </View>
            {t.roster && t.roster.length > 0 && (
              <View style={styles.teamCardRoster}>
                {t.roster
                  .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
                  .map((castaway, idx) => (
                    <Text key={castaway.id} style={styles.teamCardCastaway}>
                      {idx + 1}. {castaway.castawayPerformance?.castaway?.name || 'Unknown'}
                    </Text>
                  ))}
              </View>
            )}
          </View>
        ))}
      </View>
      
      {isGroupLeader && (
        <TouchableOpacity 
          style={[styles.resetButton, resettingDraft && styles.startButtonDisabled]}
          onPress={handleResetDraft}
          disabled={loading || resettingDraft}
        >
          {resettingDraft ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Reset Draft</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
    <ConfirmDialog
      visible={resetModalVisible}
      title="Reset Draft"
      message="Are you sure you want to reset the draft? This cannot be undone."
      confirmText="Reset"
      cancelText="Cancel"
      confirmVariant="danger"
      onCancel={() => setResetModalVisible(false)}
      onConfirm={confirmResetDraft}
    />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  teamName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  totalPointsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  totalPoints: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
  },
  rosterSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  castawayInfo: {
    flex: 1,
  },
  draftOrder: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  castawayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  pointsDisplay: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  pointsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.warning,
    textAlign: 'center',
  },
  // Draft-specific styles
  draftStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  draftingStatus: {
    color: '#ff6b35',
  },
  draftInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  draftInfoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  countdownSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
  },
  countdownLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  countdownSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  draftDetailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  draftDetail: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  draftDetailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  draftDetailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    marginTop: Spacing.xl,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 6,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  groupTeamsSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  teamCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  yourTeamCard: {
    backgroundColor: '#e8f4f8',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  teamCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  teamRosterCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  teamCardRoster: {
    gap: Spacing.xs,
  },
  teamCardCastaway: {
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 2,
  },
});

