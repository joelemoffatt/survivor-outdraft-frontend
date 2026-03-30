import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { BorderRadius, Colors, FontSizes, Shadow, Spacing } from '../../constants/theme';
import { apiService, CastawayScoreBreakdown, getApiAssetUri, GroupResponse, ScoreBreakdownResponse, TeamResponse } from '../../services/api';
import { formatAdvantageMovement } from '../../services/textFormatter';
import { getImportedCastawayImageSource } from '../../utils/castawayImages';
import AvatarCircle from './AvatarCircle';
import Card from './Card';
import EpisodeEventsModal from './EpisodeEventsModal';

interface TeamViewProps {
  team: TeamResponse;
  group?: GroupResponse | null;
  scoreBreakdown: ScoreBreakdownResponse | null;
  onDetailsPress?: () => void;
  isOwnTeam?: boolean;
}

type CastawayStatus = 'booted' | 'first' | 'second' | 'third' | 'lostFire';

export default function TeamView({ team, group, scoreBreakdown, onDetailsPress, isOwnTeam = false }: TeamViewProps) {
  const router = useRouter();
  const [isScoreModalVisible, setIsScoreModalVisible] = useState(false);
  const [selectedCastaway, setSelectedCastaway] = useState<CastawayScoreBreakdown | null>(null);
  const [selectedCastawayEpisodes, setSelectedCastawayEpisodes] = useState<{
    episodeNumber: number | null;
    episodeTitle?: string | null;
    events: { id?: number | string; label: string; points?: number | null }[];
  }[]>([]);
  const [selectedCastawaySeasonId, setSelectedCastawaySeasonId] = useState<number | null>(null);
  const [advantageTextByEpisode, setAdvantageTextByEpisode] = useState<Record<number, string[]>>({});
  const [loadingCastawayBreakdownId, setLoadingCastawayBreakdownId] = useState<number | null>(null);
  const modalRequestIdRef = useRef(0);

  const loadAdvantageTextForBreakdown = async (breakdown: CastawayScoreBreakdown) => {
    let seasonId =
      group?.season?.id ??
      team.roster?.find((r) => r.id === breakdown.teamCastawayId)?.castawayPerformance?.seasonId ??
      null;
    if (!seasonId && team.roster && team.roster.length > 0) {
      seasonId = team.roster[0].castawayPerformance?.seasonId ?? null;
    }
    if (!seasonId) {
      return {} as Record<number, string[]>;
    }

    const castawayName = breakdown.castawayName?.trim().toLowerCase() ?? '';
    if (!castawayName || !breakdown.scoreEvents?.length) {
      return {} as Record<number, string[]>;
    }

    const advantageEpisodeNumbers = breakdown.scoreEvents
      .filter(
        (event) =>
          event.episodeNumber != null &&
          /advantage/i.test(event.eventLabel) &&
          /(found|played)/i.test(event.eventLabel),
      )
      .map((event) => event.episodeNumber as number);

    const uniqueEpisodeNumbers = Array.from(new Set(advantageEpisodeNumbers));
    if (uniqueEpisodeNumbers.length === 0) {
      return {} as Record<number, string[]>;
    }

    const entries = await Promise.all(
      uniqueEpisodeNumbers.map(async (episodeNumber) => {
        const detail = await apiService.getEpisodeDetail(seasonId, episodeNumber);
        const rows = detail.advantageMovements
          .filter(
            (movement) =>
              movement.castawayName?.trim().toLowerCase() === castawayName &&
              /found|played/i.test(movement.event ?? ''),
          )
          .map((movement) =>
            formatAdvantageMovement(
              movement.castawayName,
              movement.event,
              movement.advantageType,
              movement.playedForName,
              movement.success,
              movement.votesNullified,
            ),
          );

        return [episodeNumber, rows] as const;
      }),
    );

    return Object.fromEntries(entries);
  };

  const getScoreEventLabel = (eventLabel: string, episodeNumber: number | null) => {
    const castawayPrefix = `${selectedCastaway?.castawayName ?? ''} - `;
    const labelWithoutName = eventLabel.startsWith(castawayPrefix)
      ? eventLabel.slice(castawayPrefix.length)
      : eventLabel;

    if (episodeNumber == null || !/advantage/i.test(eventLabel) || !/(found|played)/i.test(labelWithoutName)) {
      return labelWithoutName;
    }

    const candidates = advantageTextByEpisode[episodeNumber] ?? [];
    if (candidates.length === 0) {
      return labelWithoutName;
    }

    const lowerLabel = labelWithoutName.toLowerCase();
    const desiredPrefix =
      lowerLabel.includes('found') ? 'found ' : lowerLabel.includes('played') ? 'played ' : null;

    if (!desiredPrefix) {
      return labelWithoutName;
    }

    const matched = candidates.find((candidate) => candidate.toLowerCase().startsWith(desiredPrefix));
    return matched ?? candidates[0];
  };

  const getCastawayStatus = (
    backendPlacement?: 'booted' | 'first' | 'second' | 'third' | 'lostFire' | null,
  ): CastawayStatus | null => {
    return backendPlacement ?? null;
  };

  const eliminatedCount = (team.roster ?? []).filter((castaway) => castaway.placement != null).length;
  const castawaysLeft = Math.max(0, (team.roster?.length ?? 0) - eliminatedCount);

  const closeScoreModal = () => {
    setIsScoreModalVisible(false);
    setSelectedCastaway(null);
    setAdvantageTextByEpisode({});
    setSelectedCastawaySeasonId(null);
  };

  const navigateToEpisodeFromModal = (seasonId: number, episodeNumber: number) => {
    setIsScoreModalVisible(false);
    setSelectedCastaway(null);
    setAdvantageTextByEpisode({});
    router.push({
      pathname: '/(player)/history/season/[season]/episode/[episode]',
      params: {
        season: String(seasonId),
        episode: String(episodeNumber),
      },
    });
  };

  return (
    <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Your Team */}
        <Card style={styles.headerCard} shadow="medium">
        <View style={styles.headerTop}>
          <View style={styles.headerIdentity}>
            <AvatarCircle
              size={46}
              uri={getApiAssetUri(team.avatarImage)}
              fallbackText={team.teamName}
              style={styles.teamAvatarCircle}
            />
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
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{castawaysLeft}</Text>
            <Text style={styles.statLabel}>Castaways Left</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Roster</Text>
      <Card style={styles.membersCard} padding="sm" shadow="light">
        {team.roster && team.roster.length > 0 ? (
          <View>
            {team.roster
              .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
              .map((teamCastaway, index, roster) => {
                const castawayName = teamCastaway.castawayPerformance?.castaway?.name || 'Unknown';
                const seasonId = teamCastaway.castawayPerformance?.seasonId;
                const jsonId = teamCastaway.castawayPerformance?.castaway?.json_id;
                const castawayId = teamCastaway.castawayPerformance?.castaway?.id;
                const castawayImageSource = getImportedCastawayImageSource(seasonId, jsonId);
                const breakdown = scoreBreakdown?.castaways?.find(
                  (c) => c.teamCastawayId === teamCastaway.id
                );
                const isLoadingBreakdown = loadingCastawayBreakdownId === teamCastaway.id;
                const castawayStatus = getCastawayStatus(teamCastaway.placement ?? null);
                const isBooted = castawayStatus === 'booted';
                const pts = breakdown?.totalPoints ?? teamCastaway.points;
                return (
                  <View
                    key={teamCastaway.id}
                    style={[
                      styles.memberRow,
                      castawayStatus === 'booted' && styles.memberRowBooted,
                      castawayStatus === 'first' && styles.memberRowFirst,
                      castawayStatus === 'second' && styles.memberRowSecond,
                      castawayStatus === 'third' && styles.memberRowThird,
                      castawayStatus === 'lostFire' && styles.memberRowLostFire,
                      index < roster.length - 1 && styles.memberRowBorder,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.memberLeft}
                      onPress={() =>
                        castawayId &&
                        router.push({
                          pathname: '/(player)/history/castaways/[id]',
                          params: {
                            id: String(castawayId),
                            season: seasonId != null ? String(seasonId) : undefined,
                            jsonId,
                          },
                        })
                      }
                      disabled={!castawayId}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${castawayName} details`}
                    >
                      <AvatarCircle
                        size={32}
                        source={castawayImageSource}
                        fallbackText={castawayName}
                        style={styles.avatarCircle}
                      />
                      <Text
                        style={[
                          styles.memberUsername,
                          castawayStatus === 'booted' && styles.memberUsernameBooted,
                          castawayStatus === 'first' && styles.memberUsernameFirst,
                          castawayStatus === 'second' && styles.memberUsernameSecond,
                          castawayStatus === 'third' && styles.memberUsernameThird,
                          castawayStatus === 'lostFire' && styles.memberUsernameLostFire,
                        ]}
                      >
                        {castawayName}
                      </Text>
                      <Text
                        style={[
                          styles.memberPick,
                          castawayStatus === 'booted' && styles.memberPickBooted,
                          castawayStatus === 'first' && styles.memberPickFirst,
                          castawayStatus === 'second' && styles.memberPickSecond,
                          castawayStatus === 'third' && styles.memberPickThird,
                          castawayStatus === 'lostFire' && styles.memberPickLostFire,
                        ]}
                      >
                        Pick #{teamCastaway.draftOrder ?? index + 1}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.memberPointsButton}
                      onPress={async () => {
                        if (!breakdown) {
                          return;
                        }

                        const requestId = modalRequestIdRef.current + 1;
                        modalRequestIdRef.current = requestId;
                        setLoadingCastawayBreakdownId(breakdown.teamCastawayId);

                        let loadedAdvantageTextByEpisode: Record<number, string[]> = {};
                        try {
                          loadedAdvantageTextByEpisode = await loadAdvantageTextForBreakdown(breakdown);
                        } catch {
                          loadedAdvantageTextByEpisode = {};
                        }

                        if (modalRequestIdRef.current !== requestId) {
                          if (loadingCastawayBreakdownId === breakdown.teamCastawayId) {
                            setLoadingCastawayBreakdownId(null);
                          }
                          return;
                        }

                        setAdvantageTextByEpisode(loadedAdvantageTextByEpisode);

                        // Build episodes with titles (if possible) and events with points
                        let seasonId =
                          group?.season?.id ??
                          team.roster?.find((r) => r.id === breakdown.teamCastawayId)?.castawayPerformance?.seasonId ??
                          null;
                        if (!seasonId && team.roster && team.roster.length > 0) {
                          seasonId = team.roster[0].castawayPerformance?.seasonId ?? null;
                        }
                        const uniqueEpisodeNumbers = Array.from(
                          new Set((breakdown.scoreEvents ?? []).map((e) => e.episodeNumber ?? null)),
                        ).filter((n) => n != null) as number[];

                        let episodesPrepared: typeof selectedCastawayEpisodes = [];
                        if (seasonId && uniqueEpisodeNumbers.length > 0) {
                          try {
                            const episodesList = await apiService.getEpisodes(seasonId);
                            const titleByEp = new Map<number, string>(
                              episodesList.map((d) => [d.episodeNumber, d.episodeTitle]),
                            );

                            const groups = new Map<number | null, typeof breakdown.scoreEvents>();
                            (breakdown.scoreEvents ?? [])
                              .slice()
                              .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                              .forEach((ev) => {
                                const key = ev.episodeNumber ?? null;
                                const arr = groups.get(key) ?? [];
                                arr.push(ev);
                                groups.set(key, arr);
                              });

                            episodesPrepared = Array.from(groups.entries())
                              .sort((a, b) => (a[0] ?? -1) - (b[0] ?? -1))
                              .map(([episodeNumber, events]) => ({
                                episodeNumber: episodeNumber ?? null,
                                episodeTitle: episodeNumber != null ? titleByEp.get(episodeNumber) ?? undefined : undefined,
                                events: events.map((ev) => ({ id: ev.id, label: getScoreEventLabel(ev.eventLabel, ev.episodeNumber), points: ev.totalPoints })),
                              }));
                          } catch (err) {
                            // fallback: build without titles
                            const groups = new Map<number | null, typeof breakdown.scoreEvents>();
                            (breakdown.scoreEvents ?? [])
                              .slice()
                              .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                              .forEach((ev) => {
                                const key = ev.episodeNumber ?? null;
                                const arr = groups.get(key) ?? [];
                                arr.push(ev);
                                groups.set(key, arr);
                              });

                            episodesPrepared = Array.from(groups.entries())
                              .sort((a, b) => (a[0] ?? -1) - (b[0] ?? -1))
                              .map(([episodeNumber, events]) => ({
                                episodeNumber: episodeNumber ?? null,
                                episodeTitle: undefined,
                                events: events.map((ev) => ({ id: ev.id, label: getScoreEventLabel(ev.eventLabel, ev.episodeNumber), points: ev.totalPoints })),
                              }));
                          }
                        } else {
                          // no season or no episode numbers
                          const groups = new Map<number | null, typeof breakdown.scoreEvents>();
                          (breakdown.scoreEvents ?? [])
                            .slice()
                            .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                            .forEach((ev) => {
                              const key = ev.episodeNumber ?? null;
                              const arr = groups.get(key) ?? [];
                              arr.push(ev);
                              groups.set(key, arr);
                            });

                          episodesPrepared = Array.from(groups.entries())
                            .sort((a, b) => (a[0] ?? -1) - (b[0] ?? -1))
                            .map(([episodeNumber, events]) => ({
                              episodeNumber: episodeNumber ?? null,
                              episodeTitle: undefined,
                              events: events.map((ev) => ({ id: ev.id, label: getScoreEventLabel(ev.eventLabel, ev.episodeNumber), points: ev.totalPoints })),
                            }));
                        }

                        setSelectedCastawayEpisodes(episodesPrepared);
                        setSelectedCastawaySeasonId(seasonId ?? null);

                        setSelectedCastaway(breakdown);
                        setIsScoreModalVisible(true);
                        setLoadingCastawayBreakdownId(null);
                      }}
                      disabled={!breakdown || loadingCastawayBreakdownId != null}
                    >
                      {isLoadingBreakdown ? (
                        <View style={styles.memberPointsLoadingRow}>
                          <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.memberPoints,
                            castawayStatus === 'booted' && styles.memberPointsBooted,
                            castawayStatus === 'first' && styles.memberPointsFirst,
                            castawayStatus === 'second' && styles.memberPointsSecond,
                            castawayStatus === 'third' && styles.memberPointsThird,
                            castawayStatus === 'lostFire' && styles.memberPointsLostFire,
                          ]}
                        >
                          {pts} pts
                        </Text>
                      )}
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

    <EpisodeEventsModal
      visible={isScoreModalVisible}
      onClose={() => closeScoreModal()}
      title={selectedCastaway?.castawayName ?? undefined}
      subtitle={selectedCastaway ? `${selectedCastaway.totalPoints} pts total` : undefined}
      seasonId={selectedCastawaySeasonId}
      onEpisodePress={(seasonId, episodeNumber) => navigateToEpisodeFromModal(seasonId, episodeNumber)}
      episodes={selectedCastawayEpisodes}
    />

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
  scoreEventRowInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
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
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamAvatarCircle: {
    marginRight: Spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSizes.xxlarge,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xxs,
  },
  statDivider: {
    backgroundColor: Colors.border,
    height: 32,
    width: 1,
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
  memberRowBooted: {
    opacity: 0.5,
    backgroundColor: Colors.lightBackground,
  },
  memberRowFirst: {
    backgroundColor: Colors.medalGold,
  },
  memberRowSecond: {
    backgroundColor: Colors.medalSilver,
  },
  memberRowThird: {
    backgroundColor: Colors.medalBronze,
  },
  memberRowLostFire: {
    backgroundColor: Colors.lostFire,
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
  avatarCircle: {
    marginRight: Spacing.sm,
  },
  memberUsername: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  memberUsernameBooted: {
    color: Colors.textSecondary,
  },
  memberUsernameFirst: {
    color: Colors.text,
  },
  memberUsernameSecond: {
    color: Colors.text,
  },
  memberUsernameThird: {
    color: Colors.background,
  },
  memberUsernameLostFire: {
    color: Colors.warning,
  },
  memberPick: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  memberPickBooted: {
    color: Colors.textSecondary,
  },
  memberPickFirst: {
    color: Colors.text,
  },
  memberPickSecond: {
    color: Colors.text,
  },
  memberPickThird: {
    color: Colors.background,
  },
  memberPickLostFire: {
    color: Colors.warning,
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
  memberPointsBooted: {
    color: Colors.textSecondary,
  },
  memberPointsFirst: {
    color: Colors.text,
  },
  memberPointsSecond: {
    color: Colors.text,
  },
  memberPointsThird: {
    color: Colors.background,
  },
  memberPointsLostFire: {
    color: Colors.warning,
  },
  memberPointsLoadingRow: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
  scoreEventEpisodeLink: {
    fontSize: 12,
    fontWeight: '700',
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