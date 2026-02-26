import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import apiService from '../../../../../services/api';
import { Episode } from '../../../../../types/survivor';
import {
  HistoryCard,
  HistoryContainer,
  HistoryEmpty,
  HistoryLoading,
} from '../../../../../components/shared/HistoryUI';

export default function SeasonHistory() {
  const { season } = useLocalSearchParams();
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const data = await apiService.getEpisodes(Number(season));
        setEpisodes(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };
    loadEpisodes();
  }, [season]);

  if (loading) {
    return <HistoryLoading label="Loading episodes..." />;
  }

  return (
    <HistoryContainer>
      {episodes.map((episode) => (
        <HistoryCard
          key={episode.id}
          title={`Episode ${episode.episodeNumber}`}
          onPress={() => router.push(`/history/season/${season}/episode/${episode.episodeNumber}`)}
        />
      ))}
      {episodes.length === 0 && <HistoryEmpty label="No episodes available" />}
    </HistoryContainer>
  );
}
