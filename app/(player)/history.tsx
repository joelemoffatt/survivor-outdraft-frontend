import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import apiService from '../../services/api';
import { Episode, EpisodeDetail, Season } from '../../types/survivor';

type HistoryLevel = 'seasons' | 'episodes' | 'eventGroups';
type SectionKey = 'challenges' | 'journeys' | 'advantageMovements' | 'tribals' | 'boots' | 'finalResultsBoots';

const defaultExpandedSections: Record<SectionKey, boolean> = {
  challenges: true,
  journeys: false,
  advantageMovements: false,
  tribals: false,
  boots: false,
  finalResultsBoots: true,
};

export default function HistoryScreen() {
  const [level, setLevel] = useState<HistoryLevel>('seasons');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>(defaultExpandedSections);
  const [expandedChallenges, setExpandedChallenges] = useState<Record<number, boolean>>({});
  const [expandedTribalVotes, setExpandedTribalVotes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const data = await apiService.getSeasons();
        setSeasons(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load seasons');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
  }, []);

  const handleSelectSeason = async (season: Season) => {
    setSelectedSeason(season);
    setSelectedEpisode(null);
    setEpisodeDetail(null);
    setContentLoading(true);

    try {
      const episodesData = await apiService.getEpisodes(season.season);
      setEpisodes(episodesData);
      setLevel('episodes');
    } catch (error) {
      Alert.alert('Error', 'Failed to load episodes');
      console.error(error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleSelectEpisode = async (episode: Episode) => {
    if (!selectedSeason) {
      Alert.alert('Error', 'No season selected');
      return;
    }

    setSelectedEpisode(episode);
    setContentLoading(true);

    try {
      const detail = await apiService.getEpisodeDetail(selectedSeason.season, episode.episodeNumber);
      setEpisodeDetail(detail);
      setExpandedSections(defaultExpandedSections);
      setExpandedChallenges({});
      setExpandedTribalVotes({});
      setLevel('eventGroups');
    } catch (error) {
      Alert.alert('Error', 'Failed to load episode details');
      console.error(error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleBackToSeasons = () => {
    setLevel('seasons');
    setSelectedSeason(null);
    setSelectedEpisode(null);
    setEpisodes([]);
    setEpisodeDetail(null);
  };

  const handleBackToEpisodes = () => {
    setLevel('episodes');
    setSelectedEpisode(null);
    setEpisodeDetail(null);
  };

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChallenge = (index: number) => {
    setExpandedChallenges((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleTribalVotes = (index: number) => {
    setExpandedTribalVotes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isMeaningfulText = (value: string | null | undefined) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized !== '' && normalized !== 'unknown' && normalized !== 'none' && normalized !== 'n/a';
  };

  const joinParts = (parts: Array<string | null | undefined>) =>
    parts.filter((part): part is string => Boolean(part && part.trim().length > 0)).join(' • ');

  const sentenceCase = (value: string | null | undefined) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const sentenceForCastaway = (name: string, fragments: Array<string | null | undefined>) => {
    const parts = fragments.filter((part): part is string => Boolean(part && part.trim().length > 0));
    if (parts.length === 0) return name;
    const sentence = parts.join(' ').trim();
    const normalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    return `${name} - ${normalized}`;
  };

  const humanizeEvent = (value: string | null | undefined) => {
    if (!value) return '';
    const withSpaces = value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim();
    if (!withSpaces) return '';
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
  };

  const humanizeSuccess = (value: string | null | undefined) => {
    if (!value) return '';
    const normalized = value.trim().toLowerCase();
    if (!normalized) return '';
    if (normalized === 'yes' || normalized === 'true') return 'and it was successful';
    if (normalized === 'no' || normalized === 'false') return 'and it was not successful';
    return `with result ${value}`;
  };

  const advantageActionText = (event: string | null | undefined, advantageType: string | null | undefined) => {
    const rawEvent = event?.trim().toLowerCase() || '';
    if (rawEvent.includes('beware')) {
      return isMeaningfulText(advantageType)
        ? `Found beware advantage for ${advantageType}`
        : 'Found beware advantage';
    }
    return isMeaningfulText(event)
      ? `${humanizeEvent(event)}${isMeaningfulText(advantageType) ? ` a ${advantageType}` : ' an advantage'}`
      : 'Had an advantage event';
  };

  const isTribalChallenge = (challengeType: string | null | undefined) =>
    Boolean(challengeType && challengeType.toLowerCase().includes('tribal'));

  const renderHeader = () => {
    if (level === 'seasons') {
      return <Text style={styles.title}>Seasons</Text>;
    }

    if (level === 'episodes') {
      return (
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBackToSeasons}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Season {selectedSeason?.season} Episodes</Text>
        </View>
      );
    }

    return (
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackToEpisodes}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Episode {selectedEpisode?.episodeNumber} Details</Text>
      </View>
    );
  };

  const renderSeasons = () => (
    <View style={styles.columnList}>
      {seasons.map((season) => (
        <TouchableOpacity key={season.season} style={styles.rowCard} onPress={() => handleSelectSeason(season)}>
          <Text style={styles.rowTitle}>Season {season.season}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEpisodes = () => (
    <View style={styles.columnList}>
      {episodes.map((episode) => (
        <TouchableOpacity key={episode.id} style={styles.rowCard} onPress={() => handleSelectEpisode(episode)}>
          <Text style={styles.rowTitle}>Episode {episode.episodeNumber}</Text>
        </TouchableOpacity>
      ))}
      {episodes.length === 0 && <Text style={styles.emptyText}>No episodes available</Text>}
    </View>
  );

  const renderSectionHeader = (
    key: SectionKey,
    title: string,
    subtitle: string
  ) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(key)}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEventGroups = () => {
    if (!episodeDetail) {
      return <Text style={styles.emptyText}>No episode details available</Text>;
    }

    return (
      <View style={styles.columnList}>
        {episodeDetail.challenges.length > 0 && (
          <View style={[styles.sectionBlock, styles.challengeBlock]}>
            {renderSectionHeader('challenges', 'Challenges', `${episodeDetail.challenges.length} this episode`)}
            {expandedSections.challenges && (
              <View style={[styles.sectionContent, styles.challengeContent]}>
                {episodeDetail.challenges.map((challenge, challengeIndex) => (
                  <View key={`challenge-${challengeIndex}`} style={styles.lineItemWrap}>
                    <TouchableOpacity onPress={() => toggleChallenge(challengeIndex)}>
                      <Text style={styles.itemTitle}>{challenge.title}</Text>
                      <Text style={styles.itemSubtitle}>
                        {joinParts([challenge.type, challenge.number ? `Challenge #${challenge.number}` : null])}
                      </Text>
                    </TouchableOpacity>

                    {expandedChallenges[challengeIndex] && (
                      <View style={styles.subSectionContent}>
                        {challenge.performancesByTribe.length === 0 && (
                          <Text style={styles.emptyText}>No performances for this challenge</Text>
                        )}
                        {isTribalChallenge(challenge.type) ? (
                          challenge.performancesByTribe.map((group, groupIndex) => (
                            <Text key={`challenge-${challengeIndex}-tribe-${groupIndex}`} style={styles.lineText}>
                              {sentenceForCastaway(group.tribeName, [
                                group.performances[0]?.place != null
                                  ? `placed ${group.performances[0].place}`
                                  : 'competed',
                              ])}
                            </Text>
                          ))
                        ) : (
                          challenge.performancesByTribe
                            .flatMap((group) => group.performances)
                            .map((performance, perfIndex) => (
                              <Text key={`challenge-${challengeIndex}-perf-${perfIndex}`} style={styles.lineText}>
                                {sentenceForCastaway(performance.castawayName, [
                                  performance.place != null ? `placed ${performance.place}` : null,
                                  performance.won ? 'won' : null,
                                  performance.satOut ? 'sat out' : null,
                                ])}
                              </Text>
                            ))
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {episodeDetail.journeys.length > 0 && (
          <View style={[styles.sectionBlock, styles.journeyBlock]}>
            {renderSectionHeader('journeys', 'Journeys', `${episodeDetail.journeys.length} this episode`)}
            {expandedSections.journeys && (
              <View style={[styles.sectionContent, styles.journeyContent]}>
                {episodeDetail.journeys.map((journey, journeyIndex) => (
                  <Text key={`journey-${journeyIndex}`} style={styles.lineText}>
                    {sentenceForCastaway(journey.castawayName, [
                      isMeaningfulText(journey.reward ?? undefined)
                        ? `got reward ${journey.reward}`
                        : 'got no reward',
                      journey.lostVote ? 'and lost their vote' : null,
                      journey.choseToPlay ? 'and chose to play' : null,
                      isMeaningfulText(journey.event ?? undefined) ? `during ${humanizeEvent(journey.event)}` : null,
                    ])}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {episodeDetail.advantageMovements.length > 0 && (
          <View style={[styles.sectionBlock, styles.advantageBlock]}>
            {renderSectionHeader(
              'advantageMovements',
              'Advantage Movements',
              `${episodeDetail.advantageMovements.length} this episode`
            )}
            {expandedSections.advantageMovements && (
              <View style={[styles.sectionContent, styles.advantageContent]}>
                {episodeDetail.advantageMovements.map((movement, movementIndex) => (
                  <Text key={`movement-${movementIndex}`} style={styles.lineText}>
                    {sentenceForCastaway(movement.castawayName, [
                      advantageActionText(movement.event, movement.advantageType),
                      isMeaningfulText(movement.playedForName ?? undefined)
                        ? `for ${movement.playedForName}`
                        : null,
                      isMeaningfulText(movement.success ?? undefined) ? humanizeSuccess(movement.success) : null,
                      movement.votesNullified && movement.votesNullified > 0 ? `and nullified ${movement.votesNullified} votes` : null,
                    ])}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {episodeDetail.tribals.length > 0 && (
          <View style={[styles.sectionBlock, styles.tribalBlock]}>
            {renderSectionHeader('tribals', 'Tribals', `${episodeDetail.tribals.length} this episode`)}
            {expandedSections.tribals && (
              <View style={[styles.sectionContent, styles.tribalContent]}>
                {episodeDetail.tribals.map((tribal, tribalIndex) => (
                  <View key={`tribal-${tribalIndex}`} style={styles.lineItemWrap}>
                    <TouchableOpacity onPress={() => toggleTribalVotes(tribalIndex)}>
                      <Text style={styles.itemTitle}>{tribal.tribeName}</Text>
                      <Text style={styles.itemSubtitle}>
                        {isMeaningfulText(tribal.votedOutName)
                          ? `${tribal.votedOutName} was voted out${tribal.bootOrder != null ? ` at boot order ${tribal.bootOrder}` : ''}.`
                          : 'No voted out data available.'}
                      </Text>
                    </TouchableOpacity>
                    {expandedTribalVotes[tribalIndex] && (
                      <View style={styles.subSectionContent}>
                        {tribal.votes.map((vote, voteIndex) => (
                          <Text key={`tribal-${tribalIndex}-vote-${voteIndex}`} style={styles.lineText}>
                            {sentenceForCastaway(vote.voterName, [
                              `voted for ${vote.votedForName}`,
                              vote.nullified ? 'vote was nullified' : null,
                            ])}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {episodeDetail.boots.length > 0 && (
          <View style={[styles.sectionBlock, styles.bootBlock]}>
            {renderSectionHeader('boots', 'Other Boots', `${episodeDetail.boots.length} this episode`)}
            {expandedSections.boots && (
              <View style={[styles.sectionContent, styles.bootContent]}>
                {episodeDetail.boots.map((boot, bootIndex) => (
                  <Text key={`boot-${bootIndex}`} style={styles.lineText}>
                    {sentenceForCastaway(boot.castawayName, [
                      isMeaningfulText(boot.event ?? undefined) ? humanizeEvent(boot.event) : 'left the game',
                      isMeaningfulText(boot.tribeName ?? undefined) ? `from ${boot.tribeName}` : null,
                      boot.bootOrder != null ? `boot order ${boot.bootOrder}` : null,
                    ])}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {episodeDetail.finalResultsBoots && episodeDetail.finalResultsBoots.length > 0 && (
          <View style={[styles.sectionBlock, styles.resultBlock]}>
            {renderSectionHeader('finalResultsBoots', 'Results', `${episodeDetail.finalResultsBoots.length} finalist${episodeDetail.finalResultsBoots.length !== 1 ? 's' : ''}`)}
            {expandedSections.finalResultsBoots && (
              <View style={[styles.sectionContent, styles.resultContent]}>
                {episodeDetail.finalResultsBoots.map((boot, bootIndex) => (
                  <Text key={`result-${bootIndex}`} style={styles.lineText}>
                    {sentenceForCastaway(boot.castawayName, [
                      isMeaningfulText(boot.event ?? undefined) ? humanizeEvent(boot.event) : 'finished',
                      isMeaningfulText(boot.tribeName ?? undefined) ? `from ${boot.tribeName}` : null,
                      boot.bootOrder != null ? `boot order ${boot.bootOrder}` : null,
                    ])}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {episodeDetail.challenges.length === 0 &&
          episodeDetail.journeys.length === 0 &&
          episodeDetail.advantageMovements.length === 0 &&
          episodeDetail.tribals.length === 0 &&
          episodeDetail.boots.length === 0 &&
          (!episodeDetail.finalResultsBoots || episodeDetail.finalResultsBoots.length === 0) && (
            <Text style={styles.emptyText}>No episode events available</Text>
          )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Loading seasons...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>{renderHeader()}</View>

      {contentLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f4511e" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {level === 'seasons' && renderSeasons()}
          {level === 'episodes' && renderEpisodes()}
          {level === 'eventGroups' && renderEventGroups()}
        </>
      )}

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f4511e',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4511e',
  },
  columnList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  rowCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f4511e',
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  sectionBlock: {
    marginBottom: 18,
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingLeft: 10,
  },
  challengeBlock: {
    borderLeftColor: '#f97316',
  },
  journeyBlock: {
    borderLeftColor: '#16a34a',
  },
  advantageBlock: {
    borderLeftColor: '#7c3aed',
  },
  tribalBlock: {
    borderLeftColor: '#0891b2',
  },
  bootBlock: {
    borderLeftColor: '#dc2626',
  },
  resultBlock: {
    borderLeftColor: '#f59e0b',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionContent: {
    paddingLeft: 8,
  },
  challengeContent: {
    borderLeftColor: 'transparent',
  },
  journeyContent: {
    borderLeftColor: 'transparent',
  },
  advantageContent: {
    borderLeftColor: 'transparent',
  },
  tribalContent: {
    borderLeftColor: 'transparent',
  },
  bootContent: {
    borderLeftColor: 'transparent',
  },
  resultContent: {
    borderLeftColor: 'transparent',
  },
  subSectionContent: {
    marginTop: 6,
    marginLeft: 7,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  lineItemWrap: {
    marginLeft: 0,
    paddingLeft: 0,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 6,
  },
  lineText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
});
