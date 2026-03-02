import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import apiService from '../../../../../../services/api';
import { EpisodeDetail } from '../../../../../../types/survivor';
import {
  HistoryContainer,
  HistoryEmpty,
  HistoryItemSubtitle,
  HistoryItemTitle,
  HistoryLineGroup,
  HistoryLineText,
  HistoryLoading,
  HistorySection,
} from '../../../../../../components/shared/HistoryUI';
import {
  getJourneySentence,
  getChallengeSentence,
  getChallengePerformanceSentence,
  getAdvantageMovementSentence,
  getTribalSentence,
  getTribalVoteSentence,
  getBootSentence,
  getFinalResultBootSentence,
  joinParts,
  isTribalChallenge,
} from '../../../../../../services/textFormatter';

export default function EpisodeHistory() {
  const { season, episode } = useLocalSearchParams();
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({
    challenges: false,
    journeys: false,
    advantageMovements: false,
    tribals: false,
    boots: false,
    results: false,
  });

  const toggleSection = (key: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const loadEpisodeDetail = async () => {
      try {
        const detail = await apiService.getEpisodeDetail(Number(season), Number(episode));
        setEpisodeDetail(detail);
      } catch (error) {
        Alert.alert('Error', 'Failed to load episode details');
      } finally {
        setLoading(false);
      }
    };
    loadEpisodeDetail();
  }, [season, episode]);

  if (loading) {
    return <HistoryLoading label="Loading episode details..." />;
  }

  if (!episodeDetail) {
    return <HistoryEmpty label="No episode details available" />;
  }

  return (
    <HistoryContainer>
      {/* Render event groups */}
      {episodeDetail.challenges.length > 0 && (
        <HistorySection
          title="Challenges"
          category="challenges"
          collapsible
          collapsed={collapsedSections.challenges}
          onToggle={() => toggleSection('challenges')}
        >
          {episodeDetail.challenges.map((challenge, challengeIndex) => (
            <HistoryLineGroup key={`challenge-${challengeIndex}`}>
              <HistoryItemTitle>{challenge.title}</HistoryItemTitle>
              <HistoryItemSubtitle>
                {joinParts([challenge.type, challenge.number ? `Challenge #${challenge.number}` : null])}
              </HistoryItemSubtitle>
              {/* Render challenge performances */}
              {isTribalChallenge(challenge.type)
                ? challenge.performancesByTribe.map((group, groupIndex) => (
                    <HistoryLineText key={`challenge-${challengeIndex}-tribe-${groupIndex}`}>
                      {getChallengeSentence(challenge, group, challenge.performancesByTribe.length)}
                    </HistoryLineText>
                  ))
                : challenge.performancesByTribe.flatMap((group) => group.performances).map((performance, perfIndex) => (
                    <HistoryLineText key={`challenge-${challengeIndex}-perf-${perfIndex}`}>
                      {getChallengePerformanceSentence(performance, challenge.performancesByTribe.flatMap((g) => g.performances).filter(p => p.place != null).length)}
                    </HistoryLineText>
                  ))}
            </HistoryLineGroup>
          ))}
        </HistorySection>
      )}
      {episodeDetail.journeys.length > 0 && (
        <HistorySection
          title="Journeys"
          category="journeys"
          collapsible
          collapsed={collapsedSections.journeys}
          onToggle={() => toggleSection('journeys')}
        >
          {episodeDetail.journeys.map((journey, journeyIndex) => (
            <HistoryLineText key={`journey-${journeyIndex}`}>
              {getJourneySentence(journey)}
            </HistoryLineText>
          ))}
        </HistorySection>
      )}
      {episodeDetail.advantageMovements.length > 0 && (
        <HistorySection
          title="Advantage Movements"
          category="advantages"
          collapsible
          collapsed={collapsedSections.advantageMovements}
          onToggle={() => toggleSection('advantageMovements')}
        >
          {episodeDetail.advantageMovements.map((movement, movementIndex) => (
            <HistoryLineText key={`movement-${movementIndex}`}>
              {getAdvantageMovementSentence(movement)}
            </HistoryLineText>
          ))}
        </HistorySection>
      )}
      {episodeDetail.tribals.length > 0 && (
        <HistorySection
          title="Tribals"
          category="tribals"
          collapsible
          collapsed={collapsedSections.tribals}
          onToggle={() => toggleSection('tribals')}
        >
          {episodeDetail.tribals.map((tribal, tribalIndex) => (
            <HistoryLineGroup key={`tribal-${tribalIndex}`}>
              <HistoryItemTitle>{tribal.tribeName}</HistoryItemTitle>
              <HistoryItemSubtitle>{getTribalSentence(tribal)}</HistoryItemSubtitle>
              {/* Render tribal votes */}
              {tribal.votes.map((vote, voteIndex) => (
                <HistoryLineText key={`tribal-${tribalIndex}-vote-${voteIndex}`}>
                  {getTribalVoteSentence(vote)}
                </HistoryLineText>
              ))}
            </HistoryLineGroup>
          ))}
        </HistorySection>
      )}
      {episodeDetail.boots.length > 0 && (
        <HistorySection
          title="Other Boots"
          category="boots"
          collapsible
          collapsed={collapsedSections.boots}
          onToggle={() => toggleSection('boots')}
        >
          {episodeDetail.boots.map((boot, bootIndex) => (
            <HistoryLineText key={`boot-${bootIndex}`}>
              {getBootSentence(boot)}
            </HistoryLineText>
          ))}
        </HistorySection>
      )}
      {episodeDetail.finalResultsBoots && episodeDetail.finalResultsBoots.length > 0 && (
        <HistorySection
          title="Results"
          category="results"
          collapsible
          collapsed={collapsedSections.results}
          onToggle={() => toggleSection('results')}
        >
          {episodeDetail.finalResultsBoots.map((boot, bootIndex) => (
            <HistoryLineText key={`result-${bootIndex}`}>
              {getFinalResultBootSentence(boot)}
            </HistoryLineText>
          ))}
        </HistorySection>
      )}
      {episodeDetail.challenges.length === 0 &&
        episodeDetail.journeys.length === 0 &&
        episodeDetail.advantageMovements.length === 0 &&
        episodeDetail.tribals.length === 0 &&
        episodeDetail.boots.length === 0 &&
        (!episodeDetail.finalResultsBoots || episodeDetail.finalResultsBoots.length === 0) && (
          <HistoryEmpty label="No episode events available" />
        )}
    </HistoryContainer>
  );
}
