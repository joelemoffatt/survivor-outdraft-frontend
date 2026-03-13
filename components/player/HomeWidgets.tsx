import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Card from '../shared/Card';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';

export interface GroupRankingItem {
  rank: number;
  teamName: string;
  username?: string;
  points: number;
  isYourTeam?: boolean;
  teamId?: number;
}

interface LastEpisodeWidgetProps {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
}

interface TeamPointsWidgetProps {
  totalPoints: number;
  onPress?: () => void;
  style?: ViewStyle;
}

interface GroupRankingWidgetProps {
  groupName: string;
  rankings: GroupRankingItem[];
  style?: ViewStyle;
  showDimensions?: boolean;
  onTeamPress?: (teamId: number, isYourTeam?: boolean) => void;
}

export function LastEpisodeWidget({ label, onPress, style }: LastEpisodeWidgetProps) {
  return (
    <Card style={{ ...styles.squareWidget, ...(style || {}) }} padding="md" shadow="light">
      <View>
        <Text style={styles.widgetLabel}>Last Episode</Text>
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
          <Text style={styles.widgetValue}>{label}</Text>
        </TouchableOpacity>
        <Text style={styles.widgetSubtext}>Last watched</Text>
      </View>
    </Card>
  );
}

export function TeamPointsWidget({ totalPoints, onPress, style }: TeamPointsWidgetProps) {
  return (
    <Card style={{ ...styles.squareWidget, ...(style || {}) }} padding="md" shadow="light">
      <View>
        <Text style={styles.widgetLabel}>Your Team</Text>
        <TouchableOpacity disabled={!onPress} onPress={onPress}>
          <Text style={styles.widgetValue}>{totalPoints}</Text>
        </TouchableOpacity>
        <Text style={styles.widgetSubtext}>Total points</Text>
      </View>
    </Card>
  );
}

export function GroupRankingWidget({ groupName, rankings, style, showDimensions = false, onTeamPress }: GroupRankingWidgetProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  return (
    <Card
      style={{ ...styles.rankingWidget, ...(style || {}) }}
      padding="sm"
      shadow="light"
    >
      <View style={styles.rankingList} onLayout={handleLayout}>
        {rankings.length === 0 ? (
          <View style={styles.emptyRanking}>
            <Text style={styles.emptyRankingText}>No teams yet.</Text>
          </View>
        ) : null}
        {rankings.map((team, index) => (
          <View
            key={`${team.rank}-${team.teamName}`}
            style={[
              styles.rankingRow,
              team.isYourTeam && styles.yourTeamRow,
              index < rankings.length - 1 && styles.rankingRowBorder,
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{team.rank}</Text>
            </View>
            <TouchableOpacity 
              style={styles.memberInfo}
              onPress={() => team.teamId && onTeamPress?.(team.teamId, team.isYourTeam)}
              disabled={!team.teamId || !onTeamPress}
            >
              <Text style={[
                styles.memberUsername,
                team.isYourTeam ? styles.yourTeamText : (team.teamId && onTeamPress ? styles.clickableName : null),
              ]}>
                {team.username}
              </Text>
              <Text style={[
                styles.memberTeam,
                team.teamId && onTeamPress ? styles.clickableName : null,
              ]}>
                {team.teamName}
              </Text>
            </TouchableOpacity>
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
  },
  widgetLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  widgetValue: {
    color: Colors.primary,
    fontSize: FontSizes.title,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  widgetSubtext: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.sm,
  },
  rankingWidget: {
    borderRadius: BorderRadius.lg,
    marginBottom: 0,
  },
  rankingList: {
    borderRadius: BorderRadius.md,
  },
  rankingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rankingRowBorder: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  yourTeamRow: {
    backgroundColor: Colors.warningBackground,
    borderRadius: BorderRadius.md,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    marginRight: Spacing.sm,
  },
  rankText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberUsername: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  memberTeam: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xxs,
  },
  clickableTeamName: {
    color: Colors.primary,
  },
  clickableName: {
    color: Colors.primary,
  },
  teamNameText: {
    color: Colors.text,
    flex: 1,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  pointsText: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  yourTeamText: {
    color: Colors.primary,
  },
  emptyRanking: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  emptyRankingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
  },
  dimensionText: {
    color: Colors.textLight,
    fontSize: FontSizes.small,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
});
