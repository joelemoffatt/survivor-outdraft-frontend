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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSizes, Shadow, Spacing } from '../../constants/theme';
import apiService, { CastawayPerformanceDetail } from '../../services/api';
import { formatAdvantageMovement, isTribalChallenge } from '../../services/textFormatter';
import { getHistoryCategoryColor, type HistoryCategory } from '../shared/HistoryUI';

interface CastawayPerformanceAggregateCardsProps {
  performances: CastawayPerformanceDetail[];
  castawayName?: string | null;
  castawayFullName?: string | null;
}

type MetricKey =
  | 'idols'
  | 'advantages'
  | 'individualChallenges'
  | 'teamChallenges'
  | 'satOut'
  | 'journey'
  | 'votes'
  | 'votesNullified'
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
  votesCastCount: number;
  votesReceivedCount: number;
  metricCounts: Record<MetricKey, number>;
  metricEpisodeEvents: Record<MetricKey, EpisodeEventSummary[]>;
}

interface MetricCardDefinition {
  key: MetricKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  historyCategory: HistoryCategory;
  accentColor?: string;
}

const METRIC_CARD_DEFINITIONS: MetricCardDefinition[] = [
  {
    key: 'idols',
    label: 'Idols',
    icon: 'diamond-outline',
    historyCategory: 'advantages',
  },
  {
    key: 'advantages',
    label: 'Advantages',
    icon: 'sparkles-outline',
    historyCategory: 'advantages',
    accentColor: '#2ECC71',
  },
  {
    key: 'individualChallenges',
    label: 'Individual Challenges',
    icon: 'medal-outline',
    historyCategory: 'challenges',
  },
  {
    key: 'teamChallenges',
    label: 'Team Challenges',
    icon: 'people-outline',
    historyCategory: 'challenges',
    accentColor: '#3B82F6',
  },
  {
    key: 'satOut',
    label: 'Sat Out',
    icon: 'pause-circle-outline',
    historyCategory: 'boots',
  },
  {
    key: 'journey',
    label: 'Journey',
    icon: 'map-outline',
    historyCategory: 'journeys',
  },
  {
    key: 'votes',
    label: 'Votes',
    icon: 'checkmark-done-outline',
    historyCategory: 'votesCast',
  },
  {
    key: 'votesNullified',
    label: 'Votes Nullified',
    icon: 'shield-checkmark-outline',
    historyCategory: 'votesReceived',
  },
];

const MIN_VISIBLE_METRIC_CARDS = 4;
const METRIC_REMOVAL_PRIORITY: MetricKey[] = [
  'teamChallenges',
  'satOut',
  'journey',
  'votesNullified',
  'advantages',
  'individualChallenges',
  'votes',
  'idols',
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
  advantages: new Map<number, EpisodeEventSummary>(),
  individualChallenges: new Map<number, EpisodeEventSummary>(),
  teamChallenges: new Map<number, EpisodeEventSummary>(),
  satOut: new Map<number, EpisodeEventSummary>(),
  journey: new Map<number, EpisodeEventSummary>(),
  votes: new Map<number, EpisodeEventSummary>(),
  votesNullified: new Map<number, EpisodeEventSummary>(),
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

const isZeroMetricCard = (aggregate: PerformanceAggregate, metric: MetricCardDefinition) => {
  if (metric.key === 'votes') {
    return aggregate.votesCastCount === 0 && aggregate.votesReceivedCount === 0;
  }

  return aggregate.metricCounts[metric.key] === 0;
};

const getVisibleMetricCards = (aggregate: PerformanceAggregate) => {
  let visible = [...METRIC_CARD_DEFINITIONS];

  if (visible.length > MIN_VISIBLE_METRIC_CARDS) {
    for (const metricKey of METRIC_REMOVAL_PRIORITY) {
      if (visible.length <= MIN_VISIBLE_METRIC_CARDS) {
        break;
      }

      const removeIndex = visible.findIndex(
        (metric) => metric.key === metricKey && isZeroMetricCard(aggregate, metric),
      );
      if (removeIndex >= 0) {
        visible.splice(removeIndex, 1);
      }
    }

    if (visible.length > MIN_VISIBLE_METRIC_CARDS) {
      let removableCount = visible.length - MIN_VISIBLE_METRIC_CARDS;
      visible = visible.filter((metric) => {
        if (removableCount <= 0) {
          return true;
        }

        if (!isZeroMetricCard(aggregate, metric)) {
          return true;
        }

        removableCount -= 1;
        return false;
      });
    }
  }

  for (const metricKey of METRIC_REMOVAL_PRIORITY) {
    if (visible.length <= MIN_VISIBLE_METRIC_CARDS) {
      break;
    }

    const removeIndex = visible.findIndex((metric) => metric.key === metricKey);
    if (removeIndex >= 0) {
      visible.splice(removeIndex, 1);
    }
  }

  return visible;
};

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

const EpisodeEventRow = ({
  episode,
  seasonId,
  onEpisodePress,
}: {
  episode: EpisodeEventSummary;
  seasonId: number;
  onEpisodePress: (seasonId: number, episodeNumber: number) => void;
}) => (
  <View style={styles.scoreEventRow}>
    <View style={styles.scoreEventLeft}>
      <Pressable onPress={() => onEpisodePress(seasonId, episode.episodeNumber)}>
        <Text style={styles.scoreEventEpisodeLink}>{`Ep ${episode.episodeNumber}`}</Text>
      </Pressable>
      <View style={styles.scoreEventBody}>
        <Text style={styles.scoreEventTitle}>{episode.episodeTitle}</Text>
        {episode.events.map((event, index) => (
          <Text key={`${episode.episodeNumber}-${index}`} style={styles.scoreEventLabel}>
            {event}
          </Text>
        ))}
      </View>
    </View>
  </View>
);

export default function CastawayPerformanceAggregateCards({
  performances,
  castawayName,
  castawayFullName,
}: CastawayPerformanceAggregateCardsProps) {
  const router = useRouter();
  const [aggregates, setAggregates] = useState<PerformanceAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  const closeModal = () => {
    setIsModalVisible(false);
    setSelected(null);
  };

  const handleOpenEpisode = (seasonId: number, episodeNumber: number) => {
    setIsModalVisible(false);
    setSelected(null);
    router.push({
      pathname: '/(player)/history/season/[season]/episode/[episode]',
      params: {
        season: String(seasonId),
        episode: String(episodeNumber),
      },
    });
  };

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
            let votesCastCount = 0;
            let votesReceivedCount = 0;
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
                    const isIndividualChallenge = metricKey === 'individualChallenges';
                    const isTeamChallenge = metricKey === 'teamChallenges';
                    const isImmunityChallenge =
                      normalize(challenge.type).includes('immunity') ||
                      normalize(challenge.title).includes('immunity');

                    if (isIndividualChallenge && !row.won) {
                      return;
                    }

                    if (isIndividualChallenge && !isImmunityChallenge) {
                      return;
                    }

                    if (isTeamChallenge && !row.won) {
                      return;
                    }

                    if (isTeamChallenge && !isImmunityChallenge) {
                      return;
                    }

                    const outcome = row.won ? 'won' : 'participated';

                    if (row.satOut) {
                      addMetricEvent(
                        metricMaps,
                        'satOut',
                        detail.episodeNumber,
                        detail.episodeTitle,
                        `Sat out ${baseLabel.toLowerCase()}: ${challenge.title}`,
                      );
                    }

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
                const metricKey: MetricKey = rawType.includes('idol') ? 'idols' : 'advantages';
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

                if (matchesAlias(movement.castawayName, aliases) && (movement.votesNullified ?? 0) > 0) {
                  const nullifiedVotes = movement.votesNullified ?? 0;
                  const advantageLabel = movement.advantageType?.trim() || 'advantage';
                  addMetricEvent(
                    metricMaps,
                    'votesNullified',
                    detail.episodeNumber,
                    detail.episodeTitle,
                    `Nullified ${nullifiedVotes} vote${nullifiedVotes === 1 ? '' : 's'} with ${advantageLabel}`,
                  );
                }
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
                  votesCastCount += votesCast.length;
                  const castTargets = votesCast
                    .map((vote) => vote.votedForName?.trim())
                    .filter((name): name is string => Boolean(name));
                  const castLabel =
                    castTargets.length > 0
                      ? `${castTargets.length === 1 ? 'Cast vote for' : 'Cast votes for'} ${castTargets.join(', ')}`
                      : `Cast ${votesCast.length} vote${votesCast.length === 1 ? '' : 's'}`;

                  addMetricEvent(
                    metricMaps,
                    'votes',
                    detail.episodeNumber,
                    detail.episodeTitle,
                    castLabel,
                  );
                }

                if (votesOnCastaway.length > 0) {
                  votesReceivedCount += votesOnCastaway.length;
                  const receivedFrom = votesOnCastaway
                    .map((vote) => vote.voterName?.trim())
                    .filter((name): name is string => Boolean(name));
                  const nullifiedCount = votesOnCastaway.filter((vote) => vote.nullified).length;
                  const receivedBase =
                    receivedFrom.length > 0
                      ? `${receivedFrom.length === 1 ? 'Received vote from' : 'Received votes from'} ${receivedFrom.join(', ')}`
                      : `Received ${votesOnCastaway.length} vote${votesOnCastaway.length === 1 ? '' : 's'}`;
                  addMetricEvent(
                    metricMaps,
                    'votes',
                    detail.episodeNumber,
                    detail.episodeTitle,
                    `${receivedBase}${nullifiedCount > 0 ? ` (${nullifiedCount} nullified)` : ''}`,
                  );
                }

                if (matchesAlias(tribal.votedOutName, aliases) && !resultBootLabel) {
                  if (typeof tribal.bootOrder === 'number' && tribal.bootOrder > 0) {
                    resultBootLabel = `Voted out ${formatOrdinal(tribal.bootOrder)}`;
                  } else {
                    resultBootLabel = 'Voted Out';
                  }
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
                  if (!placement) {
                    return;
                  }

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
              advantages: mapToSortedEpisodeEvents(metricMaps.advantages),
              individualChallenges: mapToSortedEpisodeEvents(metricMaps.individualChallenges),
              teamChallenges: mapToSortedEpisodeEvents(metricMaps.teamChallenges),
              satOut: mapToSortedEpisodeEvents(metricMaps.satOut),
              journey: mapToSortedEpisodeEvents(metricMaps.journey),
              votes: mapToSortedEpisodeEvents(metricMaps.votes),
              votesNullified: mapToSortedEpisodeEvents(metricMaps.votesNullified),
              tribal: mapToSortedEpisodeEvents(metricMaps.tribal),
            } satisfies Record<MetricKey, EpisodeEventSummary[]>;

            const metricCounts = {
              idols: metricEpisodeEvents.idols.reduce((total, episode) => total + episode.events.length, 0),
              advantages: metricEpisodeEvents.advantages.reduce(
                (total, episode) => total + episode.events.length,
                0,
              ),
              individualChallenges: metricEpisodeEvents.individualChallenges.reduce(
                (total, episode) => total + episode.events.length,
                0,
              ),
              teamChallenges: metricEpisodeEvents.teamChallenges.reduce((total, episode) => total + episode.events.length, 0),
              satOut: metricEpisodeEvents.satOut.reduce((total, episode) => total + episode.events.length, 0),
              journey: metricEpisodeEvents.journey.reduce((total, episode) => total + episode.events.length, 0),
              votes: metricEpisodeEvents.votes.reduce((total, episode) => total + episode.events.length, 0),
              votesNullified: metricEpisodeEvents.votesNullified.reduce(
                (total, episode) => total + episode.events.length,
                0,
              ),
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
              votesCastCount,
              votesReceivedCount,
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
                    <View style={styles.resultPill}>
                      <Text style={styles.seasonResultInline}>{aggregate.resultBoot}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.tribesRow}>
                  <Text style={styles.tribesLabel}>{aggregate.tribes.length === 1 ? 'Tribe' : 'Tribes'}</Text>
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
              </View>

              <View style={styles.cardGrid}>
                {getVisibleMetricCards(aggregate).map((metric) => {
                  const accentColor = metric.accentColor ?? getHistoryCategoryColor(metric.historyCategory);

                  return (
                    <Pressable
                      key={metric.key}
                      style={[
                        styles.metricCard,
                        {
                          borderColor: accentColor,
                        },
                      ]}
                      onPress={() => {
                        setSelected({ aggregate, metric });
                        setIsModalVisible(true);
                      }}
                    >
                      <View style={styles.metricHeaderRow}>
                        <View style={[styles.metricIconBadge, { backgroundColor: accentColor }]}> 
                          <Ionicons name={metric.icon} size={16} color="#fff" />
                        </View>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                      </View>

                      <View style={styles.metricValueRow}>
                        <Text style={styles.metricValue}>
                          {metric.key === 'votes'
                            ? `${aggregate.votesCastCount} cast / ${aggregate.votesReceivedCount} received`
                            : aggregate.metricCounts[metric.key]}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        : null}

      <Modal
        visible={isModalVisible}
        animationType="none"
        transparent
        onRequestClose={() => closeModal()}
      >
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
                    seasonId={selected.aggregate.seasonId}
                    onEpisodePress={handleOpenEpisode}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>No events found for this category.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalClose} onPress={() => closeModal()}>
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
    gap: Spacing.sm,
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
  resultPill: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  generalInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  tribesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tribesLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.xs,
  },
  tribeChipsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
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
    minHeight: 102,
    borderWidth: 2,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricIconBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: Colors.text,
    fontSize: FontSizes.small,
    fontWeight: '700',
    flex: 1,
  },
  metricValueRow: {
    justifyContent: 'flex-end',
  },
  metricValue: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    lineHeight: 22,
  },
  metricHint: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '500',
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
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreEventLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.sm,
  },
  scoreEventEpisodeLink: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    width: 44,
    paddingTop: 1,
  },
  scoreEventBody: {
    flex: 1,
    gap: 2,
  },
  scoreEventTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scoreEventLabel: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
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
