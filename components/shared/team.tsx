import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { BorderRadius, Colors, FontSizes, Shadow, Spacing } from '../../constants/theme';
import { CastawayScoreBreakdown, GroupResponse, ScoreBreakdownResponse, TeamResponse } from '../../services/api';
import Card from './Card';

interface TeamViewProps {
  team: TeamResponse;
  group?: GroupResponse | null;
  scoreBreakdown: ScoreBreakdownResponse | null;
  onDetailsPress?: () => void;
  isOwnTeam?: boolean;
}

export default function TeamView({ team, group, scoreBreakdown, onDetailsPress, isOwnTeam = false }: TeamViewProps) {
  const router = useRouter();
  const [selectedCastaway, setSelectedCastaway] = useState<CastawayScoreBreakdown | null>(null);

  return (
    <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Your Team */}
        <Card style={styles.headerCard} shadow="medium">
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.teamName}>{team.teamName}</Text>
            {group && (
              <View style={styles.seasonStatusRow}>
                <Text style={styles.seasonLabel} numberOfLines={1} ellipsizeMode="tail">
                  {group.name}
                </Text>
              </View>
            )}
          </View>
          {isOwnTeam && (
            <TouchableOpacity
              style={styles.detailsIconButton}
              onPress={() => onDetailsPress ? onDetailsPress() : router.push('/(player)/groups/edit-team')}
              accessibilityRole="button"
              accessibilityLabel="Edit team"
            >
              <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{scoreBreakdown?.totalPoints ?? team.totalPoints}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Your Roster</Text>
      <Card style={styles.membersCard} padding="sm" shadow="light">
        {team.roster && team.roster.length > 0 ? (
          <View>
            {team.roster
              .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
              .map((teamCastaway, index, roster) => {
                const castawayName = teamCastaway.castawayPerformance?.castaway?.name || 'Unknown';
                const breakdown = scoreBreakdown?.castaways?.find(
                  (c) => c.teamCastawayId === teamCastaway.id
                );
                const pts = breakdown?.totalPoints ?? teamCastaway.points;
                return (
                  <View
                    key={teamCastaway.id}
                    style={[
                      styles.memberRow,
                      index < roster.length - 1 && styles.memberRowBorder,
                    ]}
                  >
                    <View style={styles.memberLeft}>
                      <Text style={styles.memberUsername}>{castawayName}</Text>
                      <Text style={styles.memberPick}>Pick #{teamCastaway.draftOrder ?? index + 1}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.memberPointsButton}
                      onPress={() => breakdown && setSelectedCastaway(breakdown)}
                      disabled={!breakdown}
                    >
                      <Text style={styles.memberPoints}>{pts} pts</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No castaways on roster</Text>
        )}
      </Card>

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
    backgroundColor: Colors.secondaryBackground,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.medium,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  teamName: {
    color: Colors.text,
    fontSize: FontSizes.xlarge,
    fontWeight: '800',
  },
  seasonStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  seasonLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  detailsIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxs,
    marginLeft: Spacing.md,
  },
  headerStats: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSizes.xxlarge,
    fontWeight: '800',
    lineHeight: 42,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  membersCard: {
    marginBottom: 0,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberRowBorder: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberUsername: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  memberPick: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  memberPointsButton: {
    marginLeft: 'auto',
    paddingVertical: Spacing.xs,
  },
  memberPoints: {
    color: Colors.primary,
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.dark,
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
    borderBottomColor: Colors.border,
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
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.light,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});