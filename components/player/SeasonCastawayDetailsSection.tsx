import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../shared/Card';
import {
  HistoryItemTitle,
  HistoryLineGroup,
  HistoryLineText,
  HistorySection,
} from '../shared/HistoryUI';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import apiService, { CastawayPerformanceDetail } from '../../services/api';
import {
  getAdvantageMovementSentence,
  getBootSentence,
  getFinalResultBootSentence,
  getTribalVoteSentence,
  isTribalChallenge,
} from '../../services/textFormatter';
import { EpisodeDetail } from '../../types/survivor';

interface SeasonCastawayDetailsSectionProps {
  performances: CastawayPerformanceDetail[];
  castawayName?: string | null;
  castawayFullName?: string | null;
}

interface VotesReceivedData {
  summary: string;
  details: string[];
}

interface CastawayEpisodeEvents {
  episodeNumber: number;
  episodeTitle: string;
  tribeChanges: string[];
  challengeWins: string[];
  advantages: string[];
  votesCast: string[];
  votesReceived: VotesReceivedData | null;
  results: string[];
  juryVotes: string[];
  hasEvents: boolean;
}

interface SeasonEventGroup {
  performanceId: number;
  seasonId: number;
  seasonName: string;
  version: string;
  episodes: CastawayEpisodeEvents[];
}

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const stripNamePrefix = (sentence: string) => {
  const index = sentence.indexOf(' - ');
  return index >= 0 ? sentence.slice(index + 3).trim() : sentence.trim();
};

const cleanAdvantageText = (text: string) =>
  text
    .replace(/for themselves/gi, 'on self')
    .replace(/\s*\(not needed\)/gi, '')
    .trim();

const matchesAlias = (value: string | null | undefined, aliases: Set<string>) => {
  const normalizedValue = normalize(value);
  return normalizedValue.length > 0 && aliases.has(normalizedValue);
};

/** Determine which tribe the castaway was on in a given episode. */
const getEpisodeTribe = (detail: EpisodeDetail, aliases: Set<string>): string | null => {
  for (const challenge of detail.challenges) {
    for (const group of challenge.performancesByTribe) {
      if (group.performances.some((p) => matchesAlias(p.castawayName, aliases))) {
        return group.tribeName;
      }
    }
  }
  for (const tribal of detail.tribals) {
    const wasAtTribal =
      matchesAlias(tribal.votedOutName, aliases) ||
      tribal.votes.some((v) => matchesAlias(v.voterName, aliases) || matchesAlias(v.votedForName, aliases));
    if (wasAtTribal && tribal.tribeName) {
      return tribal.tribeName;
    }
  }
  return null;
};

const buildEpisodeEvents = (
  detail: EpisodeDetail,
  aliases: Set<string>,
  lastTribe: string | null,
): { events: CastawayEpisodeEvents; currentTribe: string | null } => {
  const tribeChanges: string[] = [];
  const challengeWins: string[] = [];
  const advantages: string[] = [];
  const votesCast: string[] = [];
  let votesReceived: VotesReceivedData | null = null;
  const results: string[] = [];
  const juryVotes: string[] = [];

  // Tribe changes
  const currentTribe = getEpisodeTribe(detail, aliases);
  if (currentTribe && currentTribe !== lastTribe) {
    tribeChanges.push(lastTribe ? `Changed to ${currentTribe}` : `Playing for ${currentTribe}`);
  }

  // Individual challenge wins only (skip tribal/team challenges)
  detail.challenges.forEach((challenge) => {
    if (isTribalChallenge(challenge.type)) return;
    challenge.performancesByTribe.forEach((group) => {
      group.performances
        .filter((p) => matchesAlias(p.castawayName, aliases) && p.won === true)
        .forEach(() => {
          challengeWins.push(`Won ${challenge.title}`);
        });
    });
  });

  // Advantage movements
  detail.advantageMovements.forEach((movement) => {
    if (matchesAlias(movement.castawayName, aliases)) {
      advantages.push(cleanAdvantageText(stripNamePrefix(getAdvantageMovementSentence(movement))));
    } else if (matchesAlias(movement.playedForName, aliases)) {
      advantages.push(
        `Received ${(movement.advantageType ?? 'advantage').toLowerCase()} play from ${movement.castawayName}`,
      );
    }
  });

  // Votes cast and received
  detail.tribals.forEach((tribal) => {
    const cast = tribal.votes.filter((v) => matchesAlias(v.voterName, aliases));
    const received = tribal.votes.filter((v) => matchesAlias(v.votedForName, aliases));

    cast.forEach((vote) => {
      votesCast.push(stripNamePrefix(getTribalVoteSentence(vote)));
    });

    if (received.length > 0) {
      const nullifiedCount = received.filter((v) => v.nullified).length;
      const summary = `Received ${received.length} vote${received.length === 1 ? '' : 's'} at ${tribal.tribeName} tribal${nullifiedCount > 0 ? ` (${nullifiedCount} nullified)` : ''}`;
      const details = received.map((v) => `${v.voterName}${v.nullified ? ' (nullified)' : ''}`);
      if (votesReceived === null) {
        votesReceived = { summary, details };
      } else {
        votesReceived = {
          summary: `${votesReceived.summary}; ${summary}`,
          details: [...votesReceived.details, ...details],
        };
      }
    }
  });

  // Results (boots, final placements)
  detail.boots.forEach((boot) => {
    if (matchesAlias(boot.castawayName, aliases)) {
      results.push(stripNamePrefix(getBootSentence(boot)));
    }
  });
  detail.finalResultsBoots.forEach((boot) => {
    if (matchesAlias(boot.castawayName, aliases)) {
      results.push(stripNamePrefix(getFinalResultBootSentence(boot)));
    }
  });
  detail.finalThreeRanking.forEach((ranking) => {
    if (matchesAlias(ranking.castawayName, aliases)) {
      results.push(`Finished ${ranking.placement.toLowerCase()} with ${ranking.voteCount} jury votes`);
    }
  });

  // Jury votes
  detail.juryVotes.forEach((jv) => {
    if (matchesAlias(jv.voterName, aliases)) {
      juryVotes.push(`Cast jury vote for ${jv.votedForName}`);
    } else if (matchesAlias(jv.votedForName, aliases)) {
      juryVotes.push(`Received jury vote from ${jv.voterName}`);
    }
  });

  const hasEvents =
    tribeChanges.length > 0 ||
    challengeWins.length > 0 ||
    advantages.length > 0 ||
    votesCast.length > 0 ||
    votesReceived !== null ||
    results.length > 0 ||
    juryVotes.length > 0;

  return {
    events: {
      episodeNumber: detail.episodeNumber,
      episodeTitle: detail.episodeTitle,
      tribeChanges,
      challengeWins,
      advantages,
      votesCast,
      votesReceived,
      results,
      juryVotes,
      hasEvents,
    },
    currentTribe: currentTribe ?? lastTribe,
  };
};

export default function SeasonCastawayDetailsSection({
  performances,
  castawayName,
  castawayFullName,
}: SeasonCastawayDetailsSectionProps) {
  const [seasonGroups, setSeasonGroups] = useState<SeasonEventGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const validPerformances = performances.filter((p) => p.season?.id);
    if (validPerformances.length === 0 || aliases.size === 0) {
      setSeasonGroups([]);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const groups = await Promise.all(
          validPerformances.map(async (performance) => {
            const seasonId = performance.season!.id;
            const episodes = await apiService.getEpisodes(seasonId);
            const details = await Promise.all(
              episodes.map((ep) => apiService.getEpisodeDetail(seasonId, ep.episodeNumber)),
            );

            let lastTribe: string | null = null;
            const episodeEvents: CastawayEpisodeEvents[] = details
              .map((detail) => {
                const { events, currentTribe } = buildEpisodeEvents(detail, aliases, lastTribe);
                lastTribe = currentTribe;
                return events;
              })
              .filter((ev) => ev.hasEvents);

            return {
              performanceId: performance.id,
              seasonId,
              seasonName: performance.season?.seasonName ?? '—',
              version: performance.season?.version ?? '—',
              episodes: episodeEvents,
            } satisfies SeasonEventGroup;
          }),
        );

        setSeasonGroups(groups.filter((g) => g.episodes.length > 0));
      } catch (err) {
        console.error('Failed to load season castaway details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load season events');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [aliases, performances]);

  const epKey = (seasonId: number, ep: number) => `${seasonId}-${ep}`;
  const secKey = (seasonId: number, ep: number, sec: string) => `${seasonId}-${ep}-${sec}`;

  const toggleEpisode = (key: string) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card shadow="light">
      <Text style={styles.title}>Season Events</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading season events...</Text>
        </View>
      ) : null}

      {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && seasonGroups.length === 0 ? (
        <Text style={styles.stateText}>No castaway events found.</Text>
      ) : null}

      {!loading && !error
        ? seasonGroups.map((season) => (
            <View key={`${season.performanceId}-${season.seasonId}`} style={styles.seasonBlock}>
              <View style={styles.seasonHeader}>
                <Text style={styles.seasonTitle}>{season.seasonName}</Text>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>{season.version}</Text>
                </View>
              </View>
              <Text style={styles.seasonMeta}>
                {season.episodes.length} episode{season.episodes.length === 1 ? '' : 's'} with events
              </Text>

              <View style={styles.episodeList}>
                {season.episodes.map((ep) => {
                  const key = epKey(season.seasonId, ep.episodeNumber);
                  const expanded = expandedEpisodes.has(key);

                  return (
                    <View key={key}>
                      <Pressable
                        style={[styles.episodeRow, expanded && styles.episodeRowExpanded]}
                        onPress={() => toggleEpisode(key)}
                      >
                        <Text style={styles.epNumber}>EP {ep.episodeNumber}</Text>
                        <Text style={styles.epTitle} numberOfLines={1}>
                          {ep.episodeTitle}
                        </Text>
                        <Text style={styles.epChevron}>{expanded ? '▾' : '▸'}</Text>
                      </Pressable>

                      {expanded ? (
                        <View style={styles.sectionContainer}>
                          {ep.tribeChanges.length > 0 ? (
                            <HistorySection
                              title="Tribe"
                              category="tribe"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'tribe')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'tribe'))}
                              style={styles.section}
                            >
                              {ep.tribeChanges.map((t, i) => (
                                <HistoryLineText key={i}>{t}</HistoryLineText>
                              ))}
                            </HistorySection>
                          ) : null}

                          {ep.challengeWins.length > 0 ? (
                            <HistorySection
                              title="Challenge Wins"
                              category="challenges"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'wins')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'wins'))}
                              style={styles.section}
                            >
                              {ep.challengeWins.map((w, i) => (
                                <HistoryLineText key={i}>{w}</HistoryLineText>
                              ))}
                            </HistorySection>
                          ) : null}

                          {ep.advantages.length > 0 ? (
                            <HistorySection
                              title="Advantages"
                              category="advantages"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'adv')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'adv'))}
                              style={styles.section}
                            >
                              {ep.advantages.map((a, i) => (
                                <HistoryLineText key={i}>{a}</HistoryLineText>
                              ))}
                            </HistorySection>
                          ) : null}

                          {ep.votesCast.length > 0 ? (
                            <HistorySection
                              title="Votes Cast"
                              category="votesCast"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'cast')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'cast'))}
                              style={styles.section}
                            >
                              {ep.votesCast.map((v, i) => (
                                <HistoryLineText key={i}>{v}</HistoryLineText>
                              ))}
                            </HistorySection>
                          ) : null}

                          {ep.votesReceived ? (
                            <HistorySection
                              title="Votes Received"
                              category="votesReceived"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'recv')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'recv'))}
                              style={styles.section}
                            >
                              <HistoryLineGroup>
                                <HistoryItemTitle>{ep.votesReceived.summary}</HistoryItemTitle>
                                {ep.votesReceived.details.map((d, i) => (
                                  <HistoryLineText key={i}>• {d}</HistoryLineText>
                                ))}
                              </HistoryLineGroup>
                            </HistorySection>
                          ) : null}

                          {ep.results.length > 0 ? (
                            <HistorySection
                              title="Results"
                              category="results"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'res')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'res'))}
                              style={styles.section}
                            >
                              {ep.results.map((r, i) => (
                                <HistoryLineText key={i}>{r}</HistoryLineText>
                              ))}
                            </HistorySection>
                          ) : null}

                          {ep.juryVotes.length > 0 ? (
                            <HistorySection
                              title="Jury Votes"
                              category="jury"
                              collapsible
                              collapsed={collapsedSections[secKey(season.seasonId, ep.episodeNumber, 'jury')] ?? false}
                              onToggle={() => toggleSection(secKey(season.seasonId, ep.episodeNumber, 'jury'))}
                              style={styles.section}
                            >
                              {ep.juryVotes.map((j, i) => (
                                <HistoryLineText key={i}>{j}</HistoryLineText>
                              ))}
                            </HistorySection>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  stateText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  errorText: {
    marginTop: Spacing.sm,
    color: Colors.warning,
    fontSize: FontSizes.medium,
  },
  seasonBlock: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  seasonTitle: {
    flex: 1,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    color: Colors.text,
  },
  versionBadge: {
    borderRadius: 999,
    backgroundColor: Colors.infoBackground,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  versionBadgeText: {
    color: Colors.secondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  seasonMeta: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  episodeList: {
    gap: Spacing.xs,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  episodeRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  epNumber: {
    color: Colors.primary,
    fontSize: FontSizes.small,
    fontWeight: '700',
    minWidth: 36,
  },
  epTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  epChevron: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  sectionContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xs,
  },
});







