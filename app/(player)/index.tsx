import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import {
  GroupRankingItem,
  GroupRankingWidget,
  LastEpisodeWidget,
  TeamPointsWidget,
} from '../../components/player/HomeWidgets';

const responsiveMinHeight = 280;

export default function PlayerHome() {
  const router = useRouter();
  const { user } = useAuth();

  const topWidgets: { season: number; episode: number; teamPoints: number } = {
    season: 50,
    episode: 2,
    teamPoints: 186,
  };

  const groupRankings: GroupRankingItem[] = [
    { rank: 1, teamName: 'Hidden Immunity Idols', points: 212 },
    { rank: 2, teamName: 'Torch Snuffers', points: 199 },
    { rank: 3, teamName: 'Outlast Alliance', points: 186, isYourTeam: true },
    { rank: 4, teamName: 'Camp Chaos', points: 171 },
    { rank: 5, teamName: 'Tribal Council Kings', points: 160 },
    { rank: 6, teamName: 'Survivor Scholars', points: 142 },
    { rank: 7, teamName: 'Island Survivors', points: 128 },
    { rank: 8, teamName: 'Outdraft Warriors', points: 115 },
    { rank: 9, teamName: 'Immunity Idols', points: 102 },
    { rank: 10, teamName: 'Hidden Blindsides', points: 95 },
    { rank: 11, teamName: 'Tribal Council Titans', points: 80 },
    { rank: 12, teamName: 'Survivor Strategists', points: 68 },
    { rank: 13, teamName: 'Island Outdrafts', points: 55 },
    { rank: 14, teamName: 'Outdraft Legends', points: 40 },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Home</Text>
        <Text style={styles.pageSubtitle}>Welcome back{user?.username ? `, ${user.username}` : ''}.</Text>
      </View>

      <View style={styles.topRow}>
        <LastEpisodeWidget
          season={topWidgets.season}
          episode={topWidgets.episode}
          onPress={() => router.push('/(player)/history/episodes')}
          style={styles.topWidgetLeft}
        />
        <TeamPointsWidget totalPoints={topWidgets.teamPoints} style={styles.topWidget} />
      </View>

      <GroupRankingWidget
        groupName="Island Rivals"
        rankings={groupRankings}
        style={styles.rankingBox}
        showDimensions
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerCard: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: FontSizes.xlarge,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    marginTop: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  topWidget: {
    flex: 1,
  },
  topWidgetLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rankingBox: {
    minHeight: responsiveMinHeight,
  },
});
