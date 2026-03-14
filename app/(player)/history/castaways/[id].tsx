import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { DetailRow, DetailsSection } from '../../../../components/shared/DetailsSection';
import { Colors, FontSizes, Spacing } from '../../../../constants/theme';
import apiService, { CastawayPerformanceDetail } from '../../../../services/api';
import { Castaway } from '../../../../types/survivor';
import { getImportedCastawayImageSource } from '../../../../utils/castawayImages';

const displayValue = (value?: string | null) => {
  if (!value || !value.trim()) {
    return '—';
  }

  return value;
};

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
  const castawayInitial = castaway.name.trim().charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          {castawayImageSource ? (
            <Image source={castawayImageSource} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarInitial}>{castawayInitial}</Text>
          )}
        </View>
      </View>
      <DetailsSection title={castaway.name} subtitle={displayValue(castaway.full_name)}>
        <DetailRow label="ID" value={castaway.id} />
        <DetailRow label="JSON ID" value={displayValue(castaway.json_id)} />
        <DetailRow label="Birth Date" value={displayValue(castaway.date_of_birth)} />
        <DetailRow label="Death Date" value={displayValue(castaway.date_of_death)} />
        <DetailRow label="City" value={displayValue(castaway.city)} />
        <DetailRow label="State" value={displayValue(castaway.state)} />
        <DetailRow label="Gender" value={displayValue(castaway.gender)} />
        <DetailRow label="Occupation" value={displayValue(castaway.occupation)} />
        <DetailRow label="Hobbies" value={displayValue(castaway.hobbies)} />
        <DetailRow label="Pet Peeves" value={displayValue(castaway.pet_peeves)} />
        <DetailRow label="Three Words" value={displayValue(castaway.three_words)} noBorder />
      </DetailsSection>

      <DetailsSection title="Performances" style={styles.performancesSection}>
        {performances.length > 0 ? (
          performances.map((performance, index) => (
            <DetailRow
              key={performance.id}
              label={`Performance ${index + 1}`}
              value={displayValue(performance.season?.seasonName)}
              helperText={`Season ID: ${performance.season?.id ?? '—'} • Version: ${displayValue(performance.season?.version)} • Performance ID: ${performance.id}`}
              noBorder={index === performances.length - 1}
            />
          ))
        ) : (
          <DetailRow label="Performance Data" value="No performance records found" noBorder />
        )}
      </DetailsSection>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: Colors.background,
    fontSize: 40,
    fontWeight: '700',
  },
  performancesSection: {
    marginTop: Spacing.md,
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
