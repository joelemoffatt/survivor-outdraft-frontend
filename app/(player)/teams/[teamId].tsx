import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { TeamResponse, deriveScoreBreakdown } from '../../../services/api';
import BackButton from '../../../components/shared/BackButton';
import TeamView from '../../../components/shared/team';
import useDelayedLoader from '../../../hooks/useDelayedLoader';

export default function TeamDetailScreen() {
  const { user } = useAuth();
  const { groupData } = useGroup();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const parsedTeamId = teamId ? parseInt(teamId) : null;

  // Try to find team in context first (already loaded via dashboard)
  const teamFromContext = useMemo(
    () => groupData.teams.find((t) => t.id === parsedTeamId) ?? null,
    [groupData.teams, parsedTeamId]
  );

  const [fallbackTeam, setFallbackTeam] = useState<TeamResponse | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(fallbackLoading, 200);

  // Only fetch from API if not in context (e.g., direct navigation or different group)
  useEffect(() => {
    if (teamFromContext || !parsedTeamId || !user) return;
    setFallbackLoading(true);
    setError(null);
    apiService.getTeamById(parsedTeamId)
      .then(setFallbackTeam)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load team'))
      .finally(() => setFallbackLoading(false));
  }, [teamFromContext, parsedTeamId, user]);

  const team = teamFromContext ?? fallbackTeam;
  const loading = !teamFromContext && fallbackLoading;

  if (loading) {
    if (!showLoadingSpinner) return <View style={styles.centerContainer} />;
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

  return <TeamView team={team} scoreBreakdown={deriveScoreBreakdown(team)} />;
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
