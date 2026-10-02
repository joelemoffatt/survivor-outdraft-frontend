import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppLoader from '../../../../components/shared/AppLoader';
import { useLocalSearchParams } from 'expo-router';
import CastawayPerformanceAggregateCards from '../../../../components/player/CastawayPerformanceAggregateCards';
import CastawayProfileCard from '../../../../components/player/CastawayProfileCard';
import { Colors, FontSizes, Spacing } from '../../../../constants/theme';
import apiService, { CastawayPerformanceDetail } from '../../../../services/api';
import { Castaway } from '../../../../types/survivor';
import { getImportedCastawayImageSource } from '../../../../utils/castawayImages';
import useDelayedLoader from '../../../../hooks/useDelayedLoader';
import { SHOW_DEV_FEATURES } from '../../../../constants/featureFlags';

export default function CastawayDetailsScreen() {
  const { id, season: seasonParam, jsonId: jsonIdParam } = useLocalSearchParams<{
    id: string;
    season?: string;
    jsonId?: string;
  }>();
  const [castaway, setCastaway] = useState<Castaway | null>(null);
  const [performances, setPerformances] = useState<CastawayPerformanceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  useEffect(() => {
    const parsedId = Number(id);
    if (!id || Number.isNaN(parsedId)) {
      setCastaway(null);
      setError('Invalid castaway id');
      setLoading(false);
      return;
    }

    const loadCastaway = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, castawayPerformances] = await Promise.all([
          apiService.getCastawayById(parsedId),
          apiService.getCastawayPerformancesByCastawayId(parsedId),
        ]);
        setCastaway(data);
        setPerformances(castawayPerformances);
      } catch (detailsError) {
        console.error('Failed to load castaway details:', detailsError);
        setError(detailsError instanceof Error ? detailsError.message : 'Failed to load castaway details');
      } finally {
        setLoading(false);
      }
    };

    loadCastaway();
  }, [id]);

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return <AppLoader />;
  }

  if (error || !castaway) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? 'Castaway not found'}</Text>
      </View>
    );
  }

  const parsedSeason = seasonParam ? Number(seasonParam) : null;
  const castawayImageSource = !Number.isNaN(parsedSeason)
    ? getImportedCastawayImageSource(parsedSeason, jsonIdParam)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CastawayProfileCard castaway={castaway} imageSource={castawayImageSource} />

      {SHOW_DEV_FEATURES && (
        <CastawayPerformanceAggregateCards
          performances={performances}
          castawayName={castaway.name}
          castawayFullName={castaway.full_name}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  stateText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
    textAlign: 'center',
  },
});
