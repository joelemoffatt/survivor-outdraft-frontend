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

const normalizeSeasonName = (value?: string): string => {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .replace(/^season:\s*/i, '')
    .replace(/^survivor:\s*/i, '')
    .replace(/^survivor\s+/i, '')
    .trim();
};

const isNumericSeasonName = (value?: string): boolean => /^\d+$/.test(value ?? '');

const removeLeadingSeasonNumber = (value: string, seasonNumber: number): string => {
  return value.replace(new RegExp(`^${seasonNumber}\\s*[:\\-–]?\\s*`), '').trim();
};

const hasRegionPrefix = (value: string): boolean => /^([^:]+):\s+.+$/.test(value);

const getSeasonTitle = (season: Season): string => {
  console.log('[Seasons] seasonName before:', season.seasonName);
  const normalizedName = normalizeSeasonName(season.seasonName);
  if (!normalizedName || isNumericSeasonName(normalizedName)) {
    console.log('[Seasons] seasonName after:', normalizedName);
    return `S${season.season}`;
  }

  const cleanedName = removeLeadingSeasonNumber(normalizedName, season.season);
  console.log('[Seasons] seasonName after:', cleanedName);
  if (!cleanedName || isNumericSeasonName(cleanedName)) {
    return `S${season.season}`;
  }

  if (hasRegionPrefix(cleanedName)) {
    return `S${season.season} ${cleanedName}`;
  }

  return `S${season.season}: ${cleanedName}`;
};

export default function SeasonsScreen() {
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
          title={getSeasonTitle(season)}
          onPress={() => router.push(`/(player)/history/season/${season.season}`)}
        />
      ))}
      {seasons.length === 0 && <HistoryEmpty label="No seasons available" />}
    </HistoryContainer>
  );
}
