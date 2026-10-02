import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Colors, Spacing } from '../../constants/theme';
import apiService, {
  DraftDTO,
} from '../../services/api';
import DraftCastawayBlock from './DraftCastawayBlock';
import CastawayProfileCard from './CastawayProfileCard';
import { getImportedCastawayImageSource } from '../../utils/castawayImages';
import { useAuth } from '../../contexts/AuthContext';
import { Castaway } from '../../types/survivor';

interface DraftScreenProps {
  groupId: number;
  teamSize: number;
  onDraftComplete?: () => void;
}

export default function DraftScreen({
  groupId,
  teamSize,
  onDraftComplete,
}: DraftScreenProps) {
  const { user } = useAuth();
  const [draftState, setDraftState] = useState<DraftDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCastaway, setSelectedCastaway] = useState<number | null>(null);
  const [isPickingLoading, setIsPickingLoading] = useState(false);
  const [seasonCastaways, setSeasonCastaways] = useState<Castaway[]>([]);

  const isMyTurn = !!(user?.id && draftState?.currentTurnUser?.id === user.id);
  const isPickingLoadingRef = useRef(false);

  // Fetch draft state
  useEffect(() => {
    const fetchDraftState = async () => {
      try {
        setLoading(true);
        const state = await apiService.getDraftState(groupId);
        setDraftState(state);
      } catch (err: any) {
        console.error('Failed to fetch draft state:', err);
        setError(err?.message || 'Failed to load draft state');
      } finally {
        setLoading(false);
      }
    };

    fetchDraftState();
  }, [groupId, user?.id]);

  // Load season castaways so draft cards can use the same portraits as castaway avatars
  const draftSeasonId = draftState?.seasonId;
  useEffect(() => {
    if (!draftSeasonId) return;
    apiService.getCastaways(draftSeasonId)
      .then(setSeasonCastaways)
      .catch((err) => console.error('Failed to load season castaways:', err));
  }, [draftSeasonId]);

  // Portrait files are keyed by season number (e.g. US51), which can differ from the DB season id
  const seasonNumberMatch = draftState?.seasonName?.match(/\d+/);
  const imageSeasonNumber = seasonNumberMatch ? Number(seasonNumberMatch[0]) : draftState?.seasonId;

  const jsonIdByCastawayId = new Map<number, string>();
  seasonCastaways.forEach((castaway) => jsonIdByCastawayId.set(castaway.id, castaway.json_id));

  // Clear the selection (and its bio) once it's no longer our turn
  useEffect(() => {
    if (!isMyTurn) setSelectedCastaway(null);
  }, [isMyTurn]);

  // Keep ref in sync so the poll can skip while a pick is in flight
  useEffect(() => {
    isPickingLoadingRef.current = isPickingLoading;
  }, [isPickingLoading]);

  // Poll draft state every 3 seconds
  useEffect(() => {
    if (!draftState) return;

    const pollInterval = setInterval(async () => {
      // Skip poll while a pick request is in flight — the response will update state
      if (isPickingLoadingRef.current) return;
      try {
        const state = await apiService.getDraftState(groupId);
        setDraftState(state);

        // Check if draft is complete
        if (state.isComplete && onDraftComplete) {
          onDraftComplete();
        }
      } catch (err) {
        console.error('Failed to poll draft state:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [draftState, groupId, onDraftComplete]);

  const handleMakePick = async (castawayId: number) => {
    if (!isMyTurn || isPickingLoading) return;
    if (!draftState?.id) {
      alert('Draft is unavailable. Please refresh.');
      return;
    }

    try {
      setIsPickingLoading(true);
      isPickingLoadingRef.current = true;
      const updatedState = await apiService.makeDraftPick(
        draftState.id,
        castawayId
      );
      setDraftState(updatedState);
      setSelectedCastaway(null);

      // Check if draft is complete
      if (updatedState.isComplete && onDraftComplete) {
        onDraftComplete();
      }
    } catch (err: any) {
      console.error('Failed to make pick:', err);
      alert('Failed to make pick: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsPickingLoading(false);
    }
  };

  const handleCastawayPress = async (castawayId: number) => {
    if (!isMyTurn || isPickingLoading) {
      return;
    }

    if (selectedCastaway === castawayId) {
      await handleMakePick(castawayId);
      return;
    }

    setSelectedCastaway(castawayId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading draft...</Text>
      </View>
    );
  }

  if (error || !draftState) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load draft'}</Text>
      </View>
    );
  }

  // Full bio for the selected castaway; fall back to just the name if season bios haven't loaded
  const selectedDraftCastaway = draftState.draftCastaways?.find(
    (castaway) => castaway.castawayPerformanceId === selectedCastaway
  );
  const selectedCastawayDetails: Castaway | null = selectedDraftCastaway
    ? seasonCastaways.find((castaway) => castaway.id === selectedDraftCastaway.castawayId) ??
      ({ name: selectedDraftCastaway.castawayName, full_name: selectedDraftCastaway.castawayName } as Castaway)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Draft In Progress</Text>
        <Text style={styles.pickCounter}>
          Pick {draftState.currentPickNumber} of {draftState.totalPicks}
        </Text>
      </View>

      {/* Current Turn Banner */}
      <View style={[styles.turnBanner, isMyTurn && !isPickingLoading && styles.myTurnBanner, isPickingLoading && styles.submittingBanner]}>
        {isPickingLoading ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator size="small" color={Colors.primary} style={styles.submittingSpinner} />
            <Text style={styles.turnBannerText}>Submitting your pick...</Text>
          </View>
        ) : (
          <Text style={styles.turnBannerText}>
            {isMyTurn
              ? 'Your Turn to Pick!'
              : draftState.currentTurnUser
              ? `Waiting for ${draftState.currentTurnUser.username}`
              : 'Waiting for next turn'}
          </Text>
        )}
      </View>

      {/* Draft Order - Show all remaining picks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remaining Picks</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.remainingPicksScroll}
          contentContainerStyle={styles.remainingPicksScrollContent}
        >
          {(() => {
            const remainingPicks = [];
            let userNextPickFound = false;
            
            // Generate all remaining picks
            const openPickSlots = draftState.picks
              .filter((pick) => !pick.isPicked && pick.pickNumber >= draftState.currentPickNumber)
              .sort((a, b) => a.pickNumber - b.pickNumber);

            for (const pickSlot of openPickSlots) {
              const isUserNextPick = !userNextPickFound && user && pickSlot.user.id === user.id;
                if (isUserNextPick) {
                  userNextPickFound = true;
                }
                
                remainingPicks.push({
                  pickNumber: pickSlot.pickNumber,
                  user: pickSlot.user,
                  isUserNextPick,
                });
            }
            
            return remainingPicks.map((pick) => (
              <View
                key={pick.pickNumber}
                style={[
                  styles.remainingPickCard,
                  pick.isUserNextPick && styles.remainingPickCardActive,
                ]}
              >
                <Text style={styles.remainingPickNumber}>#{pick.pickNumber}</Text>
                <Text style={styles.remainingPickUsername}>{pick.user.username}</Text>
              </View>
            ));
          })()}
        </ScrollView>
      </View>

      {/* Available Castaways Grid */}
      {draftState.draftCastaways?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Castaways</Text>
          {(() => {
            // Get current user's drafted castaway IDs from picks
            const userDraftedCastawayIds = new Set<number>();
            const myParticipant = draftState.participants.find((participant) => participant.user.id === user?.id);
            const myTeamId = myParticipant?.teamId;

            const draftedCounts = new Map<number, number>();
            draftState.picks
              .filter((pick) => !!pick.castawayPerformanceId)
              .forEach((pick) => {
                const castawayPerformanceId = pick.castawayPerformanceId!;
                draftedCounts.set(
                  castawayPerformanceId,
                  (draftedCounts.get(castawayPerformanceId) || 0) + 1
                );
              });

            draftState.picks
              .filter((pick) => pick.isPicked && pick.team?.id === myTeamId && !!pick.castawayPerformanceId)
              .forEach((pick) => userDraftedCastawayIds.add(pick.castawayPerformanceId!));

            const maxMeaningfulCap = Math.max(1, draftState.totalParticipants || 1);
            const teamCap = myParticipant?.maxDraftsPerCastaway || draftState.maxDraftsPerCastaway || 1;

            const countDraftableAtCap = (cap: number) =>
              draftState.draftCastaways.filter((castaway) => {
                if (userDraftedCastawayIds.has(castaway.castawayPerformanceId)) {
                  return false;
                }
                const draftedCount = draftedCounts.get(castaway.castawayPerformanceId) || 0;
                return draftedCount < cap;
              }).length;

            let effectiveCap = teamCap;
            while (countDraftableAtCap(effectiveCap) === 0 && effectiveCap < maxMeaningfulCap) {
              effectiveCap += 1;
            }

            const draftableCastaways = draftState.draftCastaways.filter((castaway) => {
              if (userDraftedCastawayIds.has(castaway.castawayPerformanceId)) {
                return false;
              }
              const draftedCount = draftedCounts.get(castaway.castawayPerformanceId) || 0;
              return draftedCount < effectiveCap;
            });

            if (draftableCastaways.length === 0) {
              return null;
            }
            
            return (
              <DraftCastawayBlock
                castaways={draftableCastaways
                  .map((castaway) => ({
                    id: castaway.castawayPerformanceId,
                    castaway: {
                      name: castaway.castawayName,
                      full_name: castaway.castawayName,
                      json_id: jsonIdByCastawayId.get(castaway.castawayId),
                    },
                  })) as any}
                selectedCastaway={selectedCastaway}
                onCastawayPress={handleCastawayPress}
                disabled={!isMyTurn || isPickingLoading}
                userDraftedCastawayIds={userDraftedCastawayIds}
                seasonId={imageSeasonNumber}
              />
            );
          })()}
        </View>
      )}

      {/* Selected Castaway Bio */}
      {selectedCastawayDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Castaway</Text>
          <Text style={styles.selectedHint}>Tap their card again to draft</Text>
          <CastawayProfileCard
            castaway={selectedCastawayDetails}
            imageSource={getImportedCastawayImageSource(imageSeasonNumber, selectedCastawayDetails.json_id)}
          />
        </View>
      )}

      {/* Team Rosters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Rosters</Text>
        {draftState.participants
          .sort((a, b) => a.draftPosition - b.draftPosition)
          .map((participant) => {
            const teamPicks = draftState.picks
              .filter((pick) => pick.isPicked && pick.team?.id === participant.teamId)
              .sort((a, b) => a.pickNumber - b.pickNumber);

            return (
          <View key={participant.id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <Text style={styles.teamName}>{participant.teamName}</Text>
              <Text style={styles.teamRosterCount}>
                {teamPicks.length || 0} / {draftState.teamSize}
              </Text>
            </View>
            {teamPicks.length > 0 ? (
              teamPicks.map((pick, idx) => (
                <Text key={pick.id} style={styles.rosterEntry}>
                  {idx + 1}. {pick.castawayName}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyRoster}>No picks yet</Text>
            )}
          </View>
            );
          })}
      </View>

      {/* Draft Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(draftState.currentPickNumber / draftState.totalPicks) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {draftState.currentPickNumber} of{' '}
          {draftState.totalPicks} picks
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  pickCounter: {
    fontSize: 16,
    color: Colors.secondary,
  },
  turnBanner: {
    backgroundColor: '#f5f5f5',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  myTurnBanner: {
    backgroundColor: '#d4edda',
    borderLeftColor: Colors.success,
  },
  submittingBanner: {
    backgroundColor: '#e8f4fd',
    borderLeftColor: Colors.primary,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingSpinner: {
    marginRight: Spacing.sm,
  },
  turnBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  selectedHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  draftOrderScroll: {
  },
  draftOrderScrollContent: {
    paddingRight: Spacing.md,
  },
  draftOrderCard: {
    backgroundColor: '#f5f5f5',
    padding: Spacing.md,
    borderRadius: 8,
    marginRight: Spacing.md,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  draftOrderCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#e3f2fd',
  },
  draftOrderPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  draftOrderUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  draftOrderPickCount: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  draftOrderNextPick: {
    fontSize: 11,
    color: '#ff6b6b',
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  pickButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonDisabled: {
    opacity: 0.6,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: Spacing.sm,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  teamRosterCount: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  rosterEntry: {
    fontSize: 13,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  emptyRoster: {
    fontSize: 13,
    color: Colors.secondary,
    fontStyle: 'italic',
    paddingVertical: Spacing.xs,
  },
  progressBar: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    backgroundColor: Colors.primary,
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: Colors.secondary,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
  },
  errorText: {
    fontSize: 14,
    color: Colors.warning,
  },
  remainingPicksScroll: {
  },
  remainingPicksScrollContent: {
    paddingRight: Spacing.md,
  },
  remainingPickCard: {
    backgroundColor: '#f5f5f5',
    padding: Spacing.md,
    borderRadius: 8,
    marginRight: Spacing.md,
    minWidth: 100,
    width: 100,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  remainingPickCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
  },
  remainingPickNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  remainingPickUsername: {
    fontSize: 13,
    color: Colors.text,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
});
