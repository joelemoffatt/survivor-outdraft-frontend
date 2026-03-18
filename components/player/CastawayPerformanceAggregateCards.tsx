import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Shadow, Spacing } from '../../constants/theme';
import apiService, { CastawayPerformanceDetail } from '../../services/api';
import { formatAdvantageMovement, isTribalChallenge } from '../../services/textFormatter';

interface CastawayPerformanceAggregateCardsProps {
  performances: CastawayPerformanceDetail[];
  castawayName?: string | null;
  castawayFullName?: string | null;
}

type MetricKey =
  | 'idols'
  | 'otherAdvantages'
  | 'individualChallenges'
  | 'teamChallenges'
  | 'journey'
  | 'votes'
  | 'tribal';

interface EpisodeEventSummary {
  episodeNumber: number;
  episodeTitle: string;
  events: string[];
}

interface PerformanceAggregate {
  performanceId: number;
  seasonId: number;
  seasonName: string;
  version: string;
  tribes: { name: string; color: string; textColor: string }[];
  resultBoot: string | null;
  metricCounts: Record<MetricKey, number>;
  metricEpisodeEvents: Record<MetricKey, EpisodeEventSummary[]>;
}

interface MetricCardDefinition {
  key: MetricKey;
  label: string;
}

const METRIC_CARD_DEFINITIONS: MetricCardDefinition[] = [
  { key: 'idols', label: 'Idols' },
  { key: 'otherAdvantages', label: 'Other Advantages' },
  { key: 'individualChallenges', label: 'Individual Challenges' },
  { key: 'teamChallenges', label: 'Team Challenges' },
  { key: 'journey', label: 'Journey' },
  { key: 'votes', label: 'Votes' },
  { key: 'tribal', label: 'Tribal' },
];

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const displayValue = (value?: string | null) => {
  if (!value || !value.trim()) {
    return '—';
  }

  return value;
};

const matchesAlias = (value: string | null | undefined, aliases: Set<string>) => {
  const normalizedValue = normalize(value);
  return normalizedValue.length > 0 && aliases.has(normalizedValue);
};

const createMetricMap = (): Record<MetricKey, Map<number, EpisodeEventSummary>> => ({
  idols: new Map<number, EpisodeEventSummary>(),
  otherAdvantages: new Map<number, EpisodeEventSummary>(),
  individualChallenges: new Map<number, EpisodeEventSummary>(),
  teamChallenges: new Map<number, EpisodeEventSummary>(),
  journey: new Map<number, EpisodeEventSummary>(),
  votes: new Map<number, EpisodeEventSummary>(),
  tribal: new Map<number, EpisodeEventSummary>(),
});

const addMetricEvent = (
  metricMaps: Record<MetricKey, Map<number, EpisodeEventSummary>>,
  metricKey: MetricKey,
  episodeNumber: number,
  episodeTitle: string,
  event: string,
) => {
  const metricMap = metricMaps[metricKey];
  const existing = metricMap.get(episodeNumber);

  if (existing) {
    existing.events.push(event);
    return;
  }

  metricMap.set(episodeNumber, {
    episodeNumber,
    episodeTitle,
    events: [event],
  });
};

const mapToSortedEpisodeEvents = (map: Map<number, EpisodeEventSummary>) =>
  [...map.values()].sort((a, b) => a.episodeNumber - b.episodeNumber);

const deriveResultBoot = (resultEvents: string[]) => {
  if (resultEvents.length === 0) {
    return '—';
  }

  return resultEvents[resultEvents.length - 1];
};

const formatOrdinal = (value: number) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
};

const formatResultEvent = (event?: string | null) => {
  const normalized = normalize(event);

  if (!normalized) {
    return null;
  }

  if (normalized.includes('lost') && normalized.includes('fire')) {
    return 'Lost in Fire Making';
  }
  if (normalized.includes('sole survivor') || normalized === 'first') {
    return 'Sole Survivor';
  }
  if (normalized === 'second' || normalized.includes('runner up')) {
    return '2nd Place';
  }
  if (normalized === 'third') {
    return '3rd Place';
  }
  if (normalized.includes('medevac') || normalized.includes('med evac')) {
    return 'Medically Evacuated';
  }
  if (normalized.includes('quit')) {
    return 'Quit';
  }
  if (normalized.includes('voted out') || normalized.includes('votedout')) {
    return 'Voted Out';
  }

  return event ?? null;
};

const getTextColorForBackground = (color: string) => {
  const normalized = color.replace('#', '');
  if (normalized.length !== 6) {
    return Colors.text;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return Colors.text;
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? Colors.text : '#fff';
};

const normalizeHexColor = (value?: string | null) => {
  if (!value || !value.trim()) {
    return Colors.lightBackground;
  }

  const color = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return Colors.lightBackground;
};

const EpisodeEventRow = ({ episode }: { episode: EpisodeEventSummary }) => (
  <View style={styles.scoreEventRow}>
    <View style={styles.scoreEventHeader}>
      <Text style={styles.scoreEventEpisode}>Ep {episode.episodeNumber}</Text>
      <Text style={styles.scoreEventCount}>{episode.events.length} events</Text>
    </View>
    <Text style={styles.scoreEventTitle}>{episode.episodeTitle}</Text>
    <View style={styles.scoreEventList}>
      {episode.events.map((event, index) => (
        <Text key={`${episode.episodeNumber}-${index}`} style={styles.scoreEventLabel}>
          • {event}
        </Text>
      ))}
    </View>
  </View>
);

export default function CastawayPerformanceAggregateCards({
  performances,
  castawayName,
  castawayFullName,
}: CastawayPerformanceAggregateCardsProps) {
  const [aggregates, setAggregates] = useState<PerformanceAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ aggregate: PerformanceAggregate; metric: MetricCardDefinition } | null>(
    null,
  );

  const aliases = useMemo(() => {
    const values = [
      castawayName,
      castawayFullName,
      performances[0]?.castaway?.name,
      performances[0]?.castaway?.full_name,
    ]
      .map(normalize)
      .filter(Boolean);

    return new Set(values);
  }, [castawayFullName, castawayName, performances]);

  const sortedPerformances = useMemo(
    () => [...performances].sort((a, b) => (a.season?.id ?? 0) - (b.season?.id ?? 0)),
    [performances],
  );

  useEffect(() => {
    const validPerformances = sortedPerformances.filter((performance) => performance.season?.id);

    if (validPerformances.length === 0 || aliases.size === 0) {
      setAggregates([]);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedAggregates = await Promise.all(
          validPerformances.map(async (performance) => {
            const seasonId = performance.season!.id;
            const episodes = await apiService.getEpisodes(seasonId);
            const details = await Promise.all(
              episodes.map((episode) => apiService.getEpisodeDetail(seasonId, episode.episodeNumber)),
            );
            const tribeRecords = await apiService.getTribes();
            const tribeColorByName = new Map(
              tribeRecords
                .filter((tribe) => tribe.seasonId === seasonId)
                .map((tribe) => [`${seasonId}:${normalize(tribe.name)}`, normalizeHexColor(tribe.color)]),
            );

            const encounteredTribes = new Set<string>();
            let resultBootLabel: string | null = null;
            const metricMaps = createMetricMap();

            details.forEach((detail) => {
              detail.challenges.forEach((challenge) => {
                challenge.performancesByTribe.forEach((group) => {
                  const appears = group.performances.some((row) => matchesAlias(row.castawayName, aliases));
                  if (appears && group.tribeName) {
                    encounteredTribes.add(group.tribeName);
                  }

                  group.performances.forEach((row) => {
                    if (!matchesAlias(row.castawayName, aliases)) {
                      return;
                    }

                    const metricKey: MetricKey = isTribalChallenge(challenge.type)
                      ? 'teamChallenges'
                      : 'individualChallenges';
                    const baseLabel = isTribalChallenge(challenge.type) ? 'Team challenge' : 'Individual challenge';
                    const outcome = row.won ? 'won' : 'participated';
                    addMetricEvent(
                      metricMaps,
                      metricKey,
                      detail.episodeNumber,
                      detail.episodeTitle,
                      `${baseLabel}: ${outcome} ${challenge.title}`,
                    );
                  });
                });
              });

              detail.advantageMovements.forEach((movement) => {
                const involved =
                  matchesAlias(movement.castawayName, aliases) || matchesAlias(movement.playedForName, aliases);

                if (!involved) {
                  return;
                }

                const rawType = movement.advantageType?.toLowerCase() || 'advantage';
                const metricKey: MetricKey = rawType.includes('idol') ? 'idols' : 'otherAdvantages';
                const description = matchesAlias(movement.castawayName, aliases)
                  ? formatAdvantageMovement(
                      movement.castawayName,
                      movement.event,
                      movement.advantageType,
                      movement.playedForName,
                      movement.success,
                      movement.votesNullified,
                    )
                  : `Received ${rawType} play from ${movement.castawayName}`;

                addMetricEvent(metricMaps, metricKey, detail.episodeNumber, detail.episodeTitle, description);
              });

              detail.journeys.forEach((journey) => {
                if (!matchesAlias(journey.castawayName, aliases)) {
                  return;
                }

                const journeyParts: string[] = [];
                if (journey.event) {
                  journeyParts.push(journey.event);
                }
                if (journey.reward) {
                  journeyParts.push(`reward: ${journey.reward}`);
                }
                if (journey.lostVote) {
                  journeyParts.push('lost vote');
                }
                if (journey.choseToPlay === false) {
                  journeyParts.push('did not play');
                }

                addMetricEvent(
                  metricMaps,
                  'journey',
                  detail.episodeNumber,
                  detail.episodeTitle,
                  journeyParts.length > 0 ? `Journey: ${journeyParts.join(', ')}` : 'Journey event',
                );
              });

              detail.tribals.forEach((tribal) => {
                const votesCast = tribal.votes.filter((vote) => matchesAlias(vote.voterName, aliases));
                const votesOnCastaway = tribal.votes.filter((vote) => matchesAlias(vote.votedForName, aliases));

                const attended =
                  votesCast.length > 0 ||
                  votesOnCastaway.length > 0 ||
                  matchesAlias(tribal.votedOutName, aliases);

                if (!attended) {
                  return;
                }

                if (tribal.tribeName) {
                  encounteredTribes.add(tribal.tribeName);
                }

                addMetricEvent(
                  metricMaps,
                  'tribal',
                  detail.episodeNumber,
                  detail.episodeTitle,
                  `Attended tribal (${tribal.tribeName || 'Unknown tribe'})`,
                );

                if (votesCast.length > 0) {
                  addMetricEvent(
                    metricMaps,
                    'votes',
                    detail.episodeNumber,
                    detail.episodeTitle,
                    `Cast ${votesCast.length} vote${votesCast.length === 1 ? '' : 's'}`,
                  );
                }

                if (votesOnCastaway.length > 0) {
                  const nullifiedCount = votesOnCastaway.filter((vote) => vote.nullified).length;
                  addMetricEvent(
                    metricMaps,
                    'votes',
                    detail.episodeNumber,
                    detail.episodeTitle,
                    `Received ${votesOnCastaway.length} vote${votesOnCastaway.length === 1 ? '' : 's'}${nullifiedCount > 0 ? ` (${nullifiedCount} nullified)` : ''}`,
                  );
                }
              });

              detail.boots.forEach((boot) => {
                if (matchesAlias(boot.castawayName, aliases)) {
                  const formattedFromEvent = formatResultEvent(boot.event);
                  if (formattedFromEvent && formattedFromEvent !== 'Voted Out') {
                    resultBootLabel = formattedFromEvent;
                    return;
                  }

                  if (typeof boot.bootOrder === 'number' && boot.bootOrder > 0) {
                    resultBootLabel = `Voted out ${formatOrdinal(boot.bootOrder)}`;
                  } else {
                    resultBootLabel = 'Voted Out';
                  }
                }
              });

              detail.finalResultsBoots.forEach((boot) => {
                if (matchesAlias(boot.castawayName, aliases)) {
                  const formattedFromEvent = formatResultEvent(boot.event);
                  if (formattedFromEvent) {
                    resultBootLabel = formattedFromEvent;
                    return;
                  }

                  if (typeof boot.bootOrder === 'number' && boot.bootOrder > 0) {
                    resultBootLabel = `Voted out ${formatOrdinal(boot.bootOrder)}`;
                  }
                }
              });

              detail.finalThreeRanking.forEach((ranking) => {
                if (matchesAlias(ranking.castawayName, aliases)) {
                  const placement = normalize(ranking.placement);
                  if (placement === 'first' || placement === '1st' || placement === '1') {
                    resultBootLabel = 'Sole Survivor';
                  } else if (placement === 'second' || placement === '2nd' || placement === '2') {
                    resultBootLabel = '2nd Place';
                  } else if (placement === 'third' || placement === '3rd' || placement === '3') {
                    resultBootLabel = '3rd Place';
                  } else {
                    if (typeof ranking.voteCount === 'number') {
                      resultBootLabel = `${ranking.placement} (${ranking.voteCount} jury votes)`;
                    } else {
                      resultBootLabel = ranking.placement;
                    }
                  }
                }
              });
            });

            const metricEpisodeEvents = {
              idols: mapToSortedEpisodeEvents(metricMaps.idols),
              otherAdvantages: mapToSortedEpisodeEvents(metricMaps.otherAdvantages),
              individualChallenges: mapToSortedEpisodeEvents(metricMaps.individualChallenges),
              teamChallenges: mapToSortedEpisodeEvents(metricMaps.teamChallenges),
              journey: mapToSortedEpisodeEvents(metricMaps.journey),
              votes: mapToSortedEpisodeEvents(metricMaps.votes),
              tribal: mapToSortedEpisodeEvents(metricMaps.tribal),
            } satisfies Record<MetricKey, EpisodeEventSummary[]>;

            const metricCounts = {
              idols: metricEpisodeEvents.idols.reduce((total, episode) => total + episode.events.length, 0),
              otherAdvantages: metricEpisodeEvents.otherAdvantages.reduce(
                (total, episode) => total + episode.events.length,
                0,
              ),
              individualChallenges: metricEpisodeEvents.individualChallenges.reduce(
                (total, episode) => total + episode.events.length,
                0,
              ),
              teamChallenges: metricEpisodeEvents.teamChallenges.reduce((total, episode) => total + episode.events.length, 0),
              journey: metricEpisodeEvents.journey.reduce((total, episode) => total + episode.events.length, 0),
              votes: metricEpisodeEvents.votes.reduce((total, episode) => total + episode.events.length, 0),
              tribal: metricEpisodeEvents.tribal.reduce((total, episode) => total + episode.events.length, 0),
            } satisfies Record<MetricKey, number>;

            return {
              performanceId: performance.id,
              seasonId,
              seasonName: displayValue(performance.season?.seasonName),
              version: displayValue(performance.season?.version),
              tribes: [...encounteredTribes]
                .sort((a, b) => a.localeCompare(b))
                .map((tribeName) => {
                  const color = tribeColorByName.get(`${seasonId}:${normalize(tribeName)}`) ?? Colors.lightBackground;
                  return {
                    name: tribeName,
                    color,
                    textColor: getTextColorForBackground(color),
                  };
                }),
              resultBoot: resultBootLabel,
              metricCounts,
              metricEpisodeEvents,
            } satisfies PerformanceAggregate;
          }),
        );

        setAggregates(loadedAggregates);
      } catch (loadError) {
        console.error('Failed to load castaway performance aggregates:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load castaway performance data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [aliases, sortedPerformances]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Performance by Castaway Record</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading performance cards...</Text>
        </View>
      ) : null}

      {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && aggregates.length === 0 ? (
        <Text style={styles.stateText}>No castaway performance records found.</Text>
      ) : null}

      {!loading && !error
        ? aggregates.map((aggregate) => (
            <View key={`${aggregate.performanceId}-${aggregate.seasonId}`} style={styles.groupContainer}>
              <View style={styles.summaryHeader}>
                <View style={styles.seasonRow}>
                  <Text style={styles.generalInfoSeason}>{aggregate.seasonName}</Text>
                  {aggregate.resultBoot ? (
                    <Text style={styles.seasonResultInline}>{aggregate.resultBoot}</Text>
                  ) : null}
                </View>
                <View style={styles.tribeChipsWrap}>
                  {aggregate.tribes.length > 0 ? (
                    aggregate.tribes.map((tribe) => (
                      <View key={tribe.name} style={[styles.tribeChip, { backgroundColor: tribe.color }]}>
                        <Text style={[styles.tribeChipText, { color: tribe.textColor }]}>{tribe.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.generalInfoText}>No tribe data</Text>
                  )}
                </View>
              </View>

              <View style={styles.cardGrid}>
                {METRIC_CARD_DEFINITIONS.map((metric) => (
                  <Pressable
                    key={metric.key}
                    style={styles.metricCard}
                    onPress={() => setSelected({ aggregate, metric })}
                  >
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{aggregate.metricCounts[metric.key]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        : null}

      <Modal visible={selected !== null} animationType="fade" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.metric.label}</Text>
            <Text style={styles.modalSubtitle}>
              {selected?.aggregate.seasonName} • {selected?.aggregate.version}
            </Text>

            <ScrollView style={styles.modalList}>
              {selected && selected.aggregate.metricEpisodeEvents[selected.metric.key].length > 0 ? (
                selected.aggregate.metricEpisodeEvents[selected.metric.key].map((episode) => (
                  <EpisodeEventRow
                    key={`${selected.aggregate.performanceId}-${selected.metric.key}-${episode.episodeNumber}`}
                    episode={episode}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No events found for this category.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.large,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stateText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
  },
  groupContainer: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.light,
  },
  summaryHeader: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  generalInfoSeason: {
    color: Colors.text,
    fontSize: FontSizes.large,
    fontWeight: '700',
  },
  seasonResultInline: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  generalInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  tribeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tribeChip: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tribeChipText: {
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48%',
    minHeight: 86,
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  metricValue: {
    color: Colors.text,
    fontSize: FontSizes.large,
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  scoreEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreEventEpisode: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scoreEventCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  scoreEventTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  scoreEventList: {
    gap: Spacing.xs,
  },
  scoreEventLabel: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
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
