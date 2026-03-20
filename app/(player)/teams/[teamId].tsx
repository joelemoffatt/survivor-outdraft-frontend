import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import apiService, { TeamResponse, ScoreBreakdownResponse } from '../../../services/api';
import BackButton from '../../../components/shared/BackButton';
import TeamView from '../../../components/shared/team';
import useDelayedLoader from '../../../hooks/useDelayedLoader';

export default function TeamDetailScreen() {
  const { user } = useAuth();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const teamData = await apiService.getTeamById(parseInt(teamId));
        setTeam(teamData);

        try {
          const breakdown = await apiService.getTeamScoreBreakdown(teamData.id);
          setScoreBreakdown(breakdown);
        } catch (err) {
          console.debug('Score breakdown not available:', err);
          setScoreBreakdown(null);
        }
      } catch (err) {
        console.error('Failed to load team:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [teamId, user]);

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.centerText}>Loading team...</Text>
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? 'Team not found'}</Text>
        <BackButton label="Go Back" style={styles.centerButton} />
      </View>
    );
  }

  return <TeamView team={team} scoreBreakdown={scoreBreakdown} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  centerButton: {
    marginTop: Spacing.lg,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
    textAlign: 'center',
  },
});

