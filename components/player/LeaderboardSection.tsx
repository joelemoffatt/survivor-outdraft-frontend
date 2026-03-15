import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { GroupRankingItem, GroupRankingWidget } from './HomeWidgets';

interface LeaderboardSectionProps {
  title: string;
  rankings: GroupRankingItem[];
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  onTeamPress?: (teamId: number, isYourTeam?: boolean) => void;
}

export default function LeaderboardSection({ title, rankings, style, titleStyle, onTeamPress }: LeaderboardSectionProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>
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
