import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Card from '../shared/Card';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

export interface GroupRankingItem {
  rank: number;
  teamName: string;
  points: number;
  isYourTeam?: boolean;
}

interface LastEpisodeWidgetProps {
  season: number;
  episode: number;
  onPress: () => void;
  style?: ViewStyle;
}

interface TeamPointsWidgetProps {
  totalPoints: number;
  style?: ViewStyle;
}

interface GroupRankingWidgetProps {
  groupName: string;
  rankings: GroupRankingItem[];
  style?: ViewStyle;
  showDimensions?: boolean;
}

export function LastEpisodeWidget({ season, episode, onPress, style }: LastEpisodeWidgetProps) {
  return (
    <Card style={{ ...styles.squareWidget, ...(style || {}) }} padding="md" shadow="light">
      <Text style={styles.widgetLabel}>Last Episode</Text>
      <Text style={styles.widgetValue}>S{season}E{episode}</Text>
      <TouchableOpacity style={styles.linkButton} onPress={onPress}>
        <Text style={styles.linkText}>Open Episode</Text>
      </TouchableOpacity>
    </Card>
  );
}

export function TeamPointsWidget({ totalPoints, style }: TeamPointsWidgetProps) {
  return (
    <Card style={{ ...styles.squareWidget, ...(style || {}) }} padding="md" shadow="light">
      <Text style={styles.widgetLabel}>Your Team</Text>
      <Text style={styles.widgetValue}>{totalPoints}</Text>
      <Text style={styles.widgetSubtext}>Total points</Text>
    </Card>
  );
}

export function GroupRankingWidget({ groupName, rankings, style, showDimensions = false }: GroupRankingWidgetProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  return (
    <Card
      style={{ ...styles.rankingWidget, ...(style || {}) }}
      padding="md"
      shadow="light"
    >
      <Text style={styles.rankingTitle}>{groupName} Ranking</Text>
      <View style={styles.rankingList} onLayout={handleLayout}>
        {rankings.map((team) => (
          <View
            key={`${team.rank}-${team.teamName}`}
            style={[styles.rankingRow, team.isYourTeam && styles.yourTeamRow]}
          >
            <Text style={styles.rankText}>#{team.rank}</Text>
            <Text style={[styles.teamNameText, team.isYourTeam && styles.yourTeamText]} numberOfLines={1}>
              {team.teamName}
            </Text>
            <Text style={[styles.pointsText, team.isYourTeam && styles.yourTeamText]}>{team.points}</Text>
          </View>
        ))}
      </View>

      {showDimensions && (
        <Text style={styles.dimensionText}>
          {Math.round(dimensions.width)} x {Math.round(dimensions.height)}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  squareWidget: {
    borderRadius: BorderRadius.lg,
    aspectRatio: 1,
    marginBottom: 0,
    justifyContent: 'space-between',
  },
  widgetLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  widgetValue: {
    color: Colors.text,
    fontSize: FontSizes.xlarge,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  widgetSubtext: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.sm,
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Colors.background,
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  rankingWidget: {
    borderRadius: BorderRadius.lg,
    marginBottom: 0,
  },
  rankingTitle: {
    color: Colors.text,
    fontSize: FontSizes.large,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  rankingList: {
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rankingRow: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  yourTeamRow: {
    backgroundColor: Colors.warningBackground,
  },
  rankText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    width: 36,
  },
  teamNameText: {
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.medium,
    fontWeight: '600',
    paddingRight: Spacing.sm,
  },
  pointsText: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '800',
    minWidth: 52,
    textAlign: 'right',
  },
  yourTeamText: {
    color: Colors.primary,
  },
  dimensionText: {
    color: Colors.textLight,
    fontSize: FontSizes.small,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
});
