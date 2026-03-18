import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import CastawayPerformanceAggregateCards from '../../../../components/player/CastawayPerformanceAggregateCards';
import CastawayProfileCard from '../../../../components/player/CastawayProfileCard';
import { Colors, FontSizes, Spacing } from '../../../../constants/theme';
import apiService, { CastawayPerformanceDetail } from '../../../../services/api';
import { Castaway } from '../../../../types/survivor';
import { getImportedCastawayImageSource } from '../../../../utils/castawayImages';

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
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Loading castaway details...</Text>
      </View>
    );
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

      <CastawayPerformanceAggregateCards
        performances={performances}
        castawayName={castaway.name}
        castawayFullName={castaway.full_name}
      />
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
