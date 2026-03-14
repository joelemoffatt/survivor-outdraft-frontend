import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import apiService from '../../../services/api';
import {
  HistoryCard,
  HistoryContainer,
  HistoryEmpty,
  HistoryLoading,
} from '../../../components/shared/HistoryUI';

interface EpisodeListItem {
  id: number;
  season: number;
  episodeNumber: number;
  episodeTitle: string;
}

export default function EpisodesScreen() {
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const seasons = await apiService.getSeasons();
        const episodesBySeason = await Promise.all(
          seasons.map(async (season) => {
            const seasonEpisodes = await apiService.getEpisodes(season.season);
            return seasonEpisodes.map((episode) => ({
              id: episode.id,
              season: season.season,
              episodeNumber: episode.episodeNumber,
              episodeTitle: episode.episodeTitle,
            }));
          }),
        );

        const flattened = episodesBySeason
          .flat()
          .sort((a, b) => {
            if (a.season !== b.season) {
              return b.season - a.season;
            }
            return a.episodeNumber - b.episodeNumber;
          });

        setEpisodes(flattened);
      } catch (episodesError) {
        console.error('Failed to load episodes list:', episodesError);
        Alert.alert('Error', 'Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, []);

  if (loading) {
    return <HistoryLoading label="Loading episodes..." />;
  }

  return (
    <HistoryContainer>
      {episodes.map((episode) => (
        <HistoryCard
          key={episode.id}
          title={`S${episode.season} - EP${episode.episodeNumber}: ${episode.episodeTitle}`}
          onPress={() =>
            router.push(`/(player)/history/season/${episode.season}/episode/${episode.episodeNumber}`)
          }
        />
      ))}
      {episodes.length === 0 && <HistoryEmpty label="No episodes available" />}
    </HistoryContainer>
  );
}
