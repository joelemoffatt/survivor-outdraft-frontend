import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Colors, Spacing } from '../../constants/theme';
import apiService, {
  DraftState,
} from '../../services/api';
import DraftCastawayBlock from './DraftCastawayBlock';
import { useAuth } from '../../contexts/AuthContext';

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
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCastaway, setSelectedCastaway] = useState<number | null>(null);
  const [isPickingLoading, setIsPickingLoading] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);

  // Fetch draft state
  useEffect(() => {
    const fetchDraftState = async () => {
      try {
        setLoading(true);
        const state = await apiService.getDraftState(groupId);
        setDraftState(state);
        
        // Check if it's current user's turn
        const turnData = await apiService.isMyTurn(groupId);
        setIsMyTurn(turnData.isMyTurn);
      } catch (err: any) {
        console.error('Failed to fetch draft state:', err);
        setError(err?.message || 'Failed to load draft state');
      } finally {
        setLoading(false);
      }
    };

    fetchDraftState();
  }, [groupId]);

  // Poll draft state every 3 seconds
  useEffect(() => {
    if (!draftState) return;

    const pollInterval = setInterval(async () => {
      try {
        const state = await apiService.getDraftState(groupId);
        setDraftState(state);

        // Check if draft is complete
        if (state.isComplete && onDraftComplete) {
          onDraftComplete();
        }

        // Update turn status
        const turnData = await apiService.isMyTurn(groupId);
        setIsMyTurn(turnData.isMyTurn);
      } catch (err) {
        console.error('Failed to poll draft state:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [draftState, groupId, onDraftComplete]);

  const handleMakePick = async (castawayId: number) => {
    if (!isMyTurn || isPickingLoading) return;

    try {
      setIsPickingLoading(true);
      const updatedState = await apiService.makeDraftPick(
        groupId,
        castawayId
      );
      setDraftState(updatedState);
      setSelectedCastaway(null);

      // Check if draft is complete
      if (updatedState.isComplete && onDraftComplete) {
        onDraftComplete();
      }

      // Update turn status
      const turnData = await apiService.isMyTurn(groupId);
      setIsMyTurn(turnData.isMyTurn);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Draft In Progress</Text>
        <Text style={styles.pickCounter}>
          Pick {draftState.currentPickNumber} of {draftState.group.teamSize! * draftState.draftOrder.length}
        </Text>
      </View>

      {/* Current Turn Banner */}
      <View style={[styles.turnBanner, isMyTurn && styles.myTurnBanner]}>
        <Text style={styles.turnBannerText}>
          {isMyTurn
            ? '🎯 Your Turn to Pick!'
            : draftState.currentTurn
            ? `⏳ Waiting for ${draftState.currentTurn.user.username}`
            : '⏳ Waiting for next turn'}
        </Text>
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
            const numPlayers = draftState.draftOrder.length;
            const totalPicks = draftState.group.teamSize! * numPlayers;
            let userNextPickFound = false;
            
            // Generate all remaining picks
            for (let pickNum = draftState.currentPickNumber; pickNum <= totalPicks; pickNum++) {
              // Calculate position using snake draft logic
              const roundNum = Math.floor((pickNum - 1) / numPlayers);
              let position;
              if (roundNum % 2 === 0) {
                // Even rounds: forward (0, 1, 2, 3)
                position = (pickNum - 1) % numPlayers;
              } else {
                // Odd rounds: backward (3, 2, 1, 0)
                position = numPlayers - 1 - ((pickNum - 1) % numPlayers);
              }
              
              const pickUser = draftState.draftOrder[position];
              if (pickUser) {
                const isUserNextPick = !userNextPickFound && user && pickUser.user.id === user.id;
                if (isUserNextPick) {
                  userNextPickFound = true;
                }
                
                remainingPicks.push({
                  pickNumber: pickNum,
                  user: pickUser.user,
                  isUserNextPick,
                });
              }
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

      {/* Undrafted Castaways Grid */}
      {draftState.undraftedCastaways.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Castaways</Text>
          <DraftCastawayBlock
            castaways={draftState.undraftedCastaways}
            selectedCastaway={selectedCastaway}
            onCastawayPress={handleCastawayPress}
            disabled={!isMyTurn || isPickingLoading}
          />
        </View>
      )}

      {/* Team Rosters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Rosters</Text>
        {draftState.teams.map((team) => (
          <View key={team.id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <Text style={styles.teamName}>{team.teamName}</Text>
              <Text style={styles.teamRosterCount}>
                {team.roster?.length || 0} / {draftState.group.teamSize}
              </Text>
            </View>
            {team.roster && team.roster.length > 0 ? (
              team.roster.map((castaway, idx) => (
                <Text key={castaway.id} style={styles.rosterEntry}>
                  {idx + 1}. {castaway.castawayPerformance.castaway.name}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyRoster}>No picks yet</Text>
            )}
          </View>
        ))}
      </View>

      {/* Draft Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(draftState.currentPickNumber / (draftState.group.teamSize! * draftState.draftOrder.length)) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {draftState.currentPickNumber} of{' '}
          {draftState.group.teamSize! * draftState.draftOrder.length} picks
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
