import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useResponsive, Colors, Spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import apiService, { TeamResponse } from '../../services/api';

export default function TeamScreen() {
  const responsive = useResponsive();
  const { user } = useAuth();
  const { selectedGroupId } = useGroup();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user || !selectedGroupId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const teamData = await apiService.getTeamByGroupAndUser(selectedGroupId, user.id);
        setTeam(teamData);
      } catch (err: any) {
        console.error('Failed to fetch team:', err);
        setError(err?.message || 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [user, selectedGroupId]);

  if (!selectedGroupId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please select a group first</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading team...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No team found for this group</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.teamName}>{team.teamName}</Text>
        <Text style={styles.totalPointsLabel}>Total Points</Text>
        <Text style={styles.totalPoints}>{team.totalPoints}</Text>
      </View>

      <View style={styles.rosterSection}>
        <Text style={styles.sectionTitle}>Roster</Text>
        {team.roster && team.roster.length > 0 ? (
          <View>
            {team.roster
              .sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0))
              .map((teamCastaway) => {
                const castawayName = teamCastaway.castawayPerformance?.castaway?.name || 'Unknown';
                return (
                  <View key={teamCastaway.id} style={styles.rosterItem}>
                    <View style={styles.castawayInfo}>
                      <Text style={styles.draftOrder}>
                        {teamCastaway.draftOrder ? `Pick #${teamCastaway.draftOrder}` : 'N/A'}
                      </Text>
                      <Text style={styles.castawayName}>{castawayName}</Text>
                    </View>
                    <View style={styles.pointsDisplay}>
                      <Text style={styles.points}>{teamCastaway.points}</Text>
                      <Text style={styles.pointsLabel}>pts</Text>
                    </View>
                  </View>
                );
              })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No castaways on roster</Text>
        )}
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Team Size</Text>
          <Text style={styles.summaryValue}>{team.roster?.length || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Average Points</Text>
          <Text style={styles.summaryValue}>
            {team.roster && team.roster.length > 0
              ? (team.totalPoints / team.roster.length).toFixed(1)
              : '0'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  teamName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  totalPointsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  totalPoints: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
  },
  rosterSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  castawayInfo: {
    flex: 1,
  },
  draftOrder: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  castawayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  pointsDisplay: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  pointsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.warning,
    textAlign: 'center',
  },
});

