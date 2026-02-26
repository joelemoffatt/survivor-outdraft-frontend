import { Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import apiService from '../../../services/api';
import { Season } from '../../../types/survivor';
import {
  HistoryCard,
  HistoryContainer,
  HistoryEmpty,
  HistoryLoading,
} from '../../../components/shared/HistoryUI';

export default function HistoryScreen() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const data = await apiService.getSeasons();
        setSeasons(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load seasons');
      } finally {
        setLoading(false);
      }
    };
    loadSeasons();
  }, []);

  if (loading) {
    return <HistoryLoading label="Loading seasons..." />;
  }

  return (
    <HistoryContainer>
      {seasons.map((season) => (
        <HistoryCard
          key={season.season}
          title={`Season ${season.season}`}
          onPress={() => router.push(`/history/season/${season.season}`)}
        />
      ))}
      {seasons.length === 0 && <HistoryEmpty label="No seasons available" />}
    </HistoryContainer>
  );
}
