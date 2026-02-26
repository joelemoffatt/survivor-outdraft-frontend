import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import apiService from "../../services/api";
import { EpisodeDetail } from "../../types/survivor";
import {
  getJourneySentence,
  getChallengeSentence,
  getChallengePerformanceSentence,
  getAdvantageMovementSentence,
  getTribalSentence,
  getTribalVoteSentence,
  getBootSentence,
  getFinalResultBootSentence,
  isTribalChallenge,
  isMeaningfulText,
} from "../../services/textFormatter";

function extractEventFragments(detail: EpisodeDetail): string[] {
  // Helper to strip 'Name - ' prefix
  const stripNamePrefix = (sentence: string) => {
    const idx = sentence.indexOf(' - ');
    return idx !== -1 ? sentence.slice(idx + 3).trim() : sentence.trim();
  };
  const fragments: string[] = [];
  // Boots
  if (detail.boots) {
    for (const boot of detail.boots) {
      fragments.push(stripNamePrefix(getBootSentence(boot)));
    }
  }
  // Final Results Boots
  if (detail.finalResultsBoots) {
    for (const boot of detail.finalResultsBoots) {
      fragments.push(stripNamePrefix(getFinalResultBootSentence(boot)));
    }
  }
  // Advantage Movements
  if (detail.advantageMovements) {
    for (const movement of detail.advantageMovements) {
      fragments.push(stripNamePrefix(getAdvantageMovementSentence(movement)));
    }
  }
  // Challenges
  if (detail.challenges) {
    for (const challenge of detail.challenges) {
      const totalTribes = challenge.performancesByTribe.length;
      for (const group of challenge.performancesByTribe) {
        fragments.push(stripNamePrefix(getChallengeSentence(challenge, group, totalTribes)));
        const totalCompetitors = group.performances.length;
        for (const perf of group.performances) {
          fragments.push(stripNamePrefix(getChallengePerformanceSentence(perf, totalCompetitors)));
        }
      }
    }
  }
  // Journeys
  if (detail.journeys) {
    for (const journey of detail.journeys) {
      fragments.push(stripNamePrefix(getJourneySentence(journey)));
    }
  }
  // Tribals
  if (detail.tribals) {
    for (const tribal of detail.tribals) {
      fragments.push(stripNamePrefix(getTribalSentence(tribal)));
      if (tribal.votes) {
        for (const vote of tribal.votes) {
          fragments.push(stripNamePrefix(getTribalVoteSentence(vote)));
        }
      }
    }
  }
  return fragments;
}

export default function PlayerEventExport() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ [sentence: string]: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    try {
      const seasons = await apiService.getSeasons();
      const filteredSeasons = seasons.filter((s) => s.season >= 1 && s.season <= 49);
      const allFragments: string[] = [];
      for (const season of filteredSeasons) {
        const episodes = await apiService.getEpisodes(season.season);
        for (const episode of episodes) {
          const detail: EpisodeDetail = await apiService.getEpisodeDetail(season.season, episode.episodeNumber);
          allFragments.push(...extractEventFragments(detail));
        }
      }
      // Count occurrences
      const counts: { [sentence: string]: number } = {};
      for (const frag of allFragments) {
        counts[frag] = (counts[frag] || 0) + 1;
      }
      // Sort by occurrences
      const sorted: { [sentence: string]: number } = {};
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([sentence, count]) => {
          sorted[sentence] = count;
        });
      setResult(sorted);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract event fragments');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Export Episode Event Sentences</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#f4511e', padding: 12, borderRadius: 8, marginBottom: 24, alignItems: 'center' }}
        onPress={handleExtract}
        disabled={loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Extracting...' : 'Extract Sentences'}</Text>
      </TouchableOpacity>
      {loading && (
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <ActivityIndicator size="large" color="#f4511e" />
          <Text style={{ marginTop: 8, color: '#999' }}>Loading...</Text>
        </View>
      )}
      {error && (
        <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
      )}
      {result && Object.keys(result).length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>JSON Output:</Text>
          <View style={{ backgroundColor: '#222', borderRadius: 8, padding: 12 }}>
            <Text style={{ color: '#fff', fontFamily: 'monospace', fontSize: 13 }}>
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        </View>
      )}
      {!loading && !result && !error && (
        <Text style={{ color: '#999', marginTop: 16 }}>Press the button above to export episode event sentences for seasons 40–49.</Text>
      )}
    </ScrollView>
  );
}