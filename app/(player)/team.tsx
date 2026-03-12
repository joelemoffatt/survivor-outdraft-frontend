import { Alert, View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { useResponsive, Colors, Spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import apiService, { TeamResponse, GroupResponse, ScoreBreakdownResponse, CastawayScoreBreakdown } from '../../services/api';
import DraftScreen from '../../components/player/DraftScreen';

export default function TeamScreen() {
  const responsive = useResponsive();
  const { user } = useAuth();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [startingDraft, setStartingDraft] = useState(false);
  const [startDraftError, setStartDraftError] = useState<string | null>(null);
  const [draftComplete, setDraftComplete] = useState(false);
  const [selectingGroup, setSelectingGroup] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdownResponse | null>(null);
  const [selectedCastaway, setSelectedCastaway] = useState<CastawayScoreBreakdown | null>(null);
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

  // Fetch score breakdown when team is available
  useEffect(() => {
    if (!team) return;
    const fetchBreakdown = async () => {
      try {
        const breakdown = await apiService.getTeamScoreBreakdown(team.id);
        setScoreBreakdown(breakdown);
      } catch (err) {
        console.debug('Score breakdown not available yet:', err);
        setScoreBreakdown(null);
      }
    };
    fetchBreakdown();
  }, [team]);

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
      setStartDraftError(null);
      await apiService.startDraft(selectedGroupId);
      
      // Refresh group data
      const groupData = await apiService.getGroupById(selectedGroupId);
      setGroup(groupData);
    } catch (err: any) {
      console.error('Failed to start draft:', err);
      const rawMessage = err?.message || 'Unknown error';
      const isUnsafeDraftConfig = rawMessage.includes('Unsafe draft configuration');

      if (isUnsafeDraftConfig) {
        const friendlyMessage =
          'This draft setup can leave someone with no legal pick. ' +
          'Try lowering team size or choosing a less advanced watched episode.';
        setStartDraftError(friendlyMessage);
        Alert.alert('Cannot Start Draft', `${friendlyMessage}\n\nDetails: ${rawMessage}`);
      } else {
        setStartDraftError(rawMessage);
        Alert.alert('Failed to start draft', rawMessage);
      }
    } finally {
      setStartingDraft(false);
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
            <>
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
              {startDraftError && (
                <Text style={styles.startDraftErrorText}>{startDraftError}</Text>
              )}
            </>
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
        <Text style={styles.teamName}>{team.teamName}</Text>
        <Text style={styles.totalPointsLabel}>Total Points</Text>
        <Text style={styles.totalPoints}>{scoreBreakdown?.totalPoints ?? team.totalPoints}</Text>
      </View>

      <View style={styles.rosterSection}>
        <Text style={styles.sectionTitle}>Your Roster</Text>
        {team.roster && team.roster.length > 0 ? (
          <View>
            {team.roster
              .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
              .map((teamCastaway) => {
                const castawayName = teamCastaway.castawayPerformance?.castaway?.name || 'Unknown';
                const breakdown = scoreBreakdown?.castaways?.find(
                  (c) => c.teamCastawayId === teamCastaway.id
                );
                const pts = breakdown?.totalPoints ?? teamCastaway.points;
                return (
                  <View key={teamCastaway.id} style={styles.rosterItem}>
                    <Text style={styles.castawayName}>{castawayName}</Text>
                    <TouchableOpacity
                      style={styles.pointsBadge}
                      onPress={() => breakdown && setSelectedCastaway(breakdown)}
                    >
                      <Text style={styles.points}>{pts}</Text>
                      <Text style={styles.pointsLabel}>pts</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No castaways on roster</Text>
        )}
      </View>

    </ScrollView>

    {/* Score events modal */}
    <Modal
      visible={selectedCastaway !== null}
      animationType="fade"
      transparent
      onRequestClose={() => setSelectedCastaway(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{selectedCastaway?.castawayName}</Text>
          <Text style={styles.modalSubtitle}>{selectedCastaway?.totalPoints} pts total</Text>
          <ScrollView style={styles.modalList}>
            {selectedCastaway?.scoreEvents && selectedCastaway.scoreEvents.length > 0 ? (
              selectedCastaway.scoreEvents
                .slice()
                .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                .map((event) => (
                  <View key={event.id} style={styles.scoreEventRow}>
                    <View style={styles.scoreEventLeft}>
                      <Text style={styles.scoreEventEpisode}>
                        {event.episodeNumber != null ? `Ep ${event.episodeNumber}` : '—'}
                      </Text>
                      <Text style={styles.scoreEventLabel}>{event.eventLabel}</Text>
                    </View>
                    <Text style={styles.scoreEventPoints}>
                      +{event.totalPoints}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.emptyText}>No scoring events yet</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedCastaway(null)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

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
  pointsBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.xl,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalList: {
    flexGrow: 0,
  },
  scoreEventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scoreEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  scoreEventEpisode: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 44,
  },
  scoreEventLabel: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  scoreEventPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  modalClose: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#fff',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#fff',
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
  startDraftErrorText: {
    marginTop: Spacing.sm,
    color: Colors.warning,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
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

