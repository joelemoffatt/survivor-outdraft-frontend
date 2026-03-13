import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { GroupRankingItem, GroupRankingWidget } from './HomeWidgets';

interface LeaderboardSectionProps {
  title: string;
  rankings: GroupRankingItem[];
  style?: ViewStyle;
  onTeamPress?: (teamId: number, isYourTeam?: boolean) => void;
}

export default function LeaderboardSection({ title, rankings, style, onTeamPress }: LeaderboardSectionProps) {
  return (
    <View style={{ ...styles.container, ...(style || {}) }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <GroupRankingWidget
        groupName=""
        rankings={rankings}
        onTeamPress={onTeamPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
});
