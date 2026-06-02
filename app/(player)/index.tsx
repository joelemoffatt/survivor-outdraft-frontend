import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AppLoader from "../../components/shared/AppLoader";
import GroupLoadingScreen from "../../components/shared/GroupLoadingScreen";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import apiService, { GroupMemberResponse } from "../../services/api";
import { Castaway } from "../../types/survivor";
import { getImportedCastawayImageSource } from "../../utils/castawayImages";
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
import CreateOrJoinGroup from "../../components/shared/CreateOrJoinGroup";
import AvatarCircle from "../../components/shared/AvatarCircle";
import Card from "../../components/shared/Card";

const getMemberStatusStyle = (status: GroupMemberResponse["status"]) => {
  switch (status) {
    case "ACCEPTED": return styles.statusBadgeActive;
    case "INVITED": return styles.statusBadgePending;
    case "DECLINED": return styles.statusBadgeCompleted;
  }
};

const getMemberStatusTextStyle = (status: GroupMemberResponse["status"]) => {
  switch (status) {
    case "ACCEPTED": return styles.statusTextActive;
    case "INVITED": return styles.statusTextPending;
    case "DECLINED": return styles.statusTextCompleted;
  }
};

export default function PlayerHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { selectedGroupId, groupsLoaded, userHasGroups, groupData } = useGroup();
  const { group, teams, members, myTeam, loading, error } = groupData;
  const [countdown, setCountdown] = useState("");
  const [castaways, setCastaways] = useState<Castaway[]>([]);
  const [castawaysLoading, setCastawaysLoading] = useState(false);


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

  useEffect(() => {
    const scheduledAt = group?.draft?.scheduledAt;
    if (!scheduledAt || group?.status !== "PENDING") { setCountdown(""); return; }
    let timeoutId: ReturnType<typeof setTimeout>;
    const update = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting soon!"); return; }
      if (diff < 5 * 60 * 1000) {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${m}m ${s}s`);
        timeoutId = setTimeout(update, 1000);
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);
        setCountdown(parts.join(" "));
        timeoutId = setTimeout(update, 60000 - (diff % 60000));
      }
    };
    update();
    return () => clearTimeout(timeoutId);
  }, [group?.draft?.scheduledAt, group?.status]);

  useEffect(() => {
    const seasonId = group?.season?.id;
    if (!seasonId || group?.status !== "PENDING") return;
    setCastawaysLoading(true);
    apiService.getCastaways(seasonId)
      .then(setCastaways)
      .catch(() => {})
      .finally(() => setCastawaysLoading(false));
  }, [group?.season?.id, group?.status]);

  const handleOpenTeam = (teamId: number) => {
    router.push({
      pathname: "/(player)/teams/[teamId]",
      params: { teamId: String(teamId) },
    });
  };

  if (!selectedGroupId) {
    if (!groupsLoaded) {
      return <AppLoader />;
    }
    if (!userHasGroups) {
      return <CreateOrJoinGroup />;
    }
    return <AppLoader />;
  }

  if (loading) {
    return <AppLoader />;
  }

  if (error || !group || !myTeam) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? "Failed to load home data."}</Text>
      </View>
    );
  }

  if (group.loading) {
    return <GroupLoadingScreen loadingText={group.loadingText} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Home</Text>
        <Text style={styles.pageSubtitle}>
          Welcome back{user?.username ? `, ${user.username}` : ""}.
        </Text>
        {group.status === "PENDING" && countdown ? (
          <View style={styles.headerCountdownRow}>
            <Text style={styles.headerCountdownLabel}>Draft in</Text>
            <Text style={styles.headerCountdownValue}>{countdown}</Text>
          </View>
        ) : null}
      </View>

      <View style={[isWideDashboard && styles.dashboardLayoutWide]}>
        {group.status !== "PENDING" && (
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
        )}

        {group.status === "PENDING" ? (
          <View style={[styles.leaderboardSection, isWideDashboard && styles.leaderboardSectionWide]}>
            <Text style={[styles.sectionTitle, isWideDashboard ? styles.leaderboardTitleWide : undefined]}>Members</Text>
            <Card padding="sm" shadow="light">
              {members.length === 0 ? (
                <Text style={styles.emptyText}>No members yet.</Text>
              ) : (
                members.map((m, index) => (
                  <View
                    key={m.id}
                    style={[
                      styles.memberRow,
                      index < members.length - 1 && styles.memberRowBorder,
                      m.user.id === user?.id && styles.memberRowSelf,
                    ]}
                  >
                    <AvatarCircle size={34} fallbackText={m.user.username} style={styles.memberAvatar} />
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, m.user.id === user?.id && styles.memberNameSelf]}>
                        {m.user.username}
                      </Text>
                    </View>
                    <View style={[styles.memberStatusBadge, getMemberStatusStyle(m.status)]}>
                      <Text style={[styles.memberStatusText, getMemberStatusTextStyle(m.status)]}>
                        {m.status === "ACCEPTED" ? "Joined" : m.status === "INVITED" ? "Invited" : "Declined"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Castaways</Text>
            <Card padding="sm" shadow="light">
              {castawaysLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <View key={i} style={[styles.exploreRow, i < 9 && styles.exploreRowBorder]}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.exploreRowText}>
                      <View style={styles.skeletonName} />
                      <View style={styles.skeletonDetail} />
                    </View>
                  </View>
                ))
              ) : (
                castaways.map((castaway, index) => (
                  <TouchableOpacity
                    key={castaway.id}
                    style={[styles.exploreRow, index < castaways.length - 1 && styles.exploreRowBorder]}
                    onPress={() =>
                      router.push({
                        pathname: "/(player)/history/castaways/[id]",
                        params: { id: String(castaway.id), season: String(group.season.id), jsonId: castaway.json_id },
                      })
                    }
                  >
                    <AvatarCircle
                      size={36}
                      source={getImportedCastawayImageSource(group.season.id, castaway.json_id)}
                      fallbackText={castaway.full_name}
                      style={styles.exploreAvatar}
                    />
                    <View style={styles.exploreRowText}>
                      <Text style={styles.exploreName}>{castaway.full_name}</Text>
                      <Text style={styles.exploreDetail}>
                        {[castaway.occupation, castaway.city && castaway.state ? `${castaway.city}, ${castaway.state}` : castaway.city ?? castaway.state].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </Card>
          </View>
        ) : (
          <LeaderboardSection
            title="Leaderboard"
            rankings={groupRankings}
            onTeamPress={handleOpenTeam}
            style={[styles.leaderboardSection, isWideDashboard && styles.leaderboardSectionWide]}
            titleStyle={isWideDashboard ? styles.leaderboardTitleWide : undefined}
          />
        )}
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
  headerCountdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  headerCountdownLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerCountdownValue: {
    color: Colors.primary,
    fontSize: FontSizes.medium,
    fontWeight: "800",
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
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: "uppercase",
  },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.medium, textAlign: "center", paddingVertical: Spacing.md },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  memberRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  memberRowSelf: { backgroundColor: Colors.lightBackground, borderRadius: BorderRadius.sm },
  memberAvatar: { marginRight: Spacing.sm },
  memberInfo: { flex: 1 },
  memberName: { color: Colors.text, fontSize: FontSizes.medium, fontWeight: "600" },
  memberNameSelf: { color: Colors.primary },
  memberStatusBadge: { alignSelf: "center", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  memberStatusText: { fontSize: FontSizes.small, fontWeight: "700" },
  statusBadgeActive: { backgroundColor: Colors.successBackground },
  statusTextActive: { color: Colors.success },
  statusBadgePending: { backgroundColor: Colors.warningBackground },
  statusTextPending: { color: Colors.primary },
  statusBadgeCompleted: { backgroundColor: Colors.lightBackground },
  statusTextCompleted: { color: Colors.textSecondary },
  exploreRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  exploreRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  exploreAvatar: { marginRight: Spacing.sm },
  exploreRowText: { flex: 1 },
  exploreName: { color: Colors.text, fontSize: FontSizes.medium, fontWeight: "600" },
  exploreDetail: { color: Colors.textSecondary, fontSize: FontSizes.small, marginTop: 2 },
  skeletonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, marginRight: Spacing.sm },
  skeletonName: { height: 14, width: "55%", borderRadius: 4, backgroundColor: Colors.border, marginBottom: 6 },
  skeletonDetail: { height: 11, width: "75%", borderRadius: 4, backgroundColor: Colors.lightBackground },
});
