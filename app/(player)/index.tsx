import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
} from "../../constants/theme";
import {
  GroupRankingItem,
  LastEpisodeWidget,
  TeamPointsWidget,
} from "../../components/player/HomeWidgets";
import LeaderboardSection from "../../components/player/LeaderboardSection";
import Button from "../../components/shared/Button";
import useDelayedLoader from "../../hooks/useDelayedLoader";

export default function PlayerHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { selectedGroupId, groupsLoaded, userHasGroups, groupData } = useGroup();
  const { group, teams, members, myTeam, loading, error } = groupData;
  const showLoadingSpinner = useDelayedLoader(loading, 200);


  const groupRankings = useMemo<GroupRankingItem[]>(() => {
    if (!myTeam) return [];

    let currentRank = 0;
    let previousPoints: number | null = null;

    return [...teams]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((team, index) => {
        if (previousPoints === null || team.totalPoints !== previousPoints) {
          currentRank = index + 1;
          previousPoints = team.totalPoints;
        }
        const matchingMember = members.find(
          (m) => m.status === "ACCEPTED" && team.userId === m.user.id,
        );
        return {
          rank: currentRank,
          teamName: team.teamName,
          username:
            matchingMember?.user.username ??
            team.username ??
            team.teamName.replace("Team ", ""),
          avatarImage: team.avatarImage,
          points: team.totalPoints,
          isYourTeam: team.id === myTeam.id,
          teamId: team.id,
        };
      });
  }, [teams, members, myTeam]);

  const displaySeasonNumber = useMemo(() => {
    if (!group) return null;
    const match = group.season.seasonName.match(/\d+/);
    return match ? Number(match[0]) : group.season.id;
  }, [group]);

  const lastEpisodeNumber = group?.latestEpisodeWatched?.episodeNumber ?? null;
  const hasLastEpisode = displaySeasonNumber != null && lastEpisodeNumber != null;
  const lastEpisodeLabel = hasLastEpisode
    ? `S${displaySeasonNumber} EP${lastEpisodeNumber}`
    : "--";
  const isWideDashboard = width >= 1100;

  const handleOpenLastEpisode = () => {
    if (!group?.latestEpisodeWatched?.episodeNumber) return;
    router.push({
      pathname: "/(player)/history/season/[season]/episode/[episode]",
      params: {
        season: String(group.season.id),
        episode: String(group.latestEpisodeWatched.episodeNumber),
      },
    });
  };

  const handleOpenTeam = (teamId: number) => {
    router.push({
      pathname: "/(player)/teams/[teamId]",
      params: { teamId: String(teamId) },
    });
  };

  if (!selectedGroupId) {
    if (groupsLoaded && !userHasGroups) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>Select a group to view live standings.</Text>
          <Button
            label="Select Group"
            variant="outline"
            size="md"
            onPress={() => router.push("/(player)/groups/select")}
            style={styles.centerButton}
            icon="swap-horizontal-outline"
          />
        </View>
      );
    }
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.centerText}>
          Select a group to see your live home dashboard.
        </Text>
      </View>
    );
  }

  if (loading) {
    if (!showLoadingSpinner) return <View style={styles.centerContainer} />;
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.centerText}>Loading home data...</Text>
      </View>
    );
  }

  if (error || !group || !myTeam) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? "Failed to load home data."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Home</Text>
        <Text style={styles.pageSubtitle}>
          Welcome back{user?.username ? `, ${user.username}` : ""}.
        </Text>
      </View>

      <View style={[isWideDashboard && styles.dashboardLayoutWide]}>
        <View style={[styles.widgetsColumn, isWideDashboard && styles.widgetsColumnWide]}>
          <LastEpisodeWidget
            label={lastEpisodeLabel}
            onPress={hasLastEpisode ? handleOpenLastEpisode : undefined}
            style={isWideDashboard ? styles.stackedWidget : styles.topWidgetLeft}
          />
          <TeamPointsWidget
            totalPoints={myTeam.totalPoints}
            onPress={() => router.push("/(player)/team")}
            style={isWideDashboard ? styles.stackedWidget : styles.topWidget}
          />
        </View>

        <LeaderboardSection
          title="Leaderboard"
          rankings={groupRankings}
          onTeamPress={handleOpenTeam}
          style={[styles.leaderboardSection, isWideDashboard && styles.leaderboardSectionWide]}
          titleStyle={isWideDashboard ? styles.leaderboardTitleWide : undefined}
        />
      </View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  centerContainer: {
    alignItems: "center",
    backgroundColor: Colors.secondaryBackground,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    textAlign: "center",
  },
  centerButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
    textAlign: "center",
  },
  headerCard: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: FontSizes.xlarge,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    marginTop: Spacing.xs,
  },
  dashboardLayoutWide: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  widgetsColumn: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  widgetsColumnWide: {
    alignSelf: "flex-start",
    flexDirection: "column",
    flexShrink: 0,
    marginBottom: 0,
    width: 280,
  },
  topWidget: { flex: 1 },
  topWidgetLeft: { flex: 1, marginRight: Spacing.md },
  stackedWidget: { marginBottom: Spacing.md, width: "100%" },
  leaderboardSection: { width: "100%" },
  leaderboardSectionWide: { alignSelf: "stretch", flex: 1 },
  leaderboardTitleWide: { marginTop: 0 },
});
