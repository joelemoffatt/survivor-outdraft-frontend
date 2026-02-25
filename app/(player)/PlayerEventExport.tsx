import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import apiService from '../../services/api';
import { EpisodeDetail } from '../../types/survivor';
import { formatBootEvent, formatAdvantageMovement, formatPlacement, isMeaningfulText } from '../../services/textFormatter';

function extractEventFragments(detail: EpisodeDetail): string[] {
  const fragments: string[] = [];
  // Boots
  if (detail.boots) {
    for (const boot of detail.boots) {
      if (isMeaningfulText(boot.event) && boot.bootOrder != null) {
        fragments.push(`${formatBootEvent(boot.event)} boot order ${boot.bootOrder}`);
      }
    }
  }
  // Advantage Movements
  if (detail.advantageMovements) {
    for (const adv of detail.advantageMovements) {
      const text = formatAdvantageMovement(
        adv.castawayName,
        adv.event,
        adv.advantageType,
        adv.playedForName,
        adv.success,
        adv.votesNullified
      );
      if (isMeaningfulText(text)) fragments.push(text);
    }
  }
  // Challenges
  if (detail.challenges) {
    for (const challenge of detail.challenges) {
      for (const group of challenge.performancesByTribe) {
        for (const perf of group.performances) {
          if (perf.place != null) {
            fragments.push(formatPlacement(perf.place, group.performances.length));
          }
        }
      }
    }
  }
  // Journeys
  if (detail.journeys) {
    for (const journey of detail.journeys) {
      if (journey.lostVote) fragments.push('lost their vote');
    }
  }
  // Tribals
  if (detail.tribals) {
    for (const tribal of detail.tribals) {
      if (isMeaningfulText(tribal.votedOutName) && tribal.bootOrder != null) {
        fragments.push(`voted out boot order ${tribal.bootOrder}`);
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
      const filteredSeasons = seasons.filter((s) => s.season >= 40 && s.season <= 49);
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
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={handleExtract} style={{ backgroundColor: '#f4511e', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Extract Episode Event Sentences (S40-49)</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#f4511e" />}
      {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Results (JSON):</Text>
          <Text selectable style={{ fontFamily: 'monospace', fontSize: 12 }}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}
