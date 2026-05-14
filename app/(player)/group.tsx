import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import apiService, { GroupResponse } from "../../services/api";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
} from "../../constants/theme";
import { GroupRankingItem } from "../../components/player/HomeWidgets";
import LeaderboardSection from "../../components/player/LeaderboardSection";
import useDelayedLoader from "../../hooks/useDelayedLoader";

const formatGroupStatus = (status?: GroupResponse["status"]) => {
  switch (status) {
    case "PENDING": return "Pending";
    case "DRAFTING": return "Drafting";
    case "ACTIVE": return "Active";
    case "COMPLETED": return "Completed";
    default: return "Unknown";
  }
};

const getStatusStyles = (status?: GroupResponse["status"]) => {
  switch (status) {
    case "ACTIVE":
      return { badge: styles.statusBadgeActive, text: styles.statusTextActive };
    case "PENDING":
      return { badge: styles.statusBadgePending, text: styles.statusTextPending };
    case "DRAFTING":
      return { badge: styles.statusBadgeDrafting, text: styles.statusTextDrafting };
    case "COMPLETED":
    default:
      return { badge: styles.statusBadgeCompleted, text: styles.statusTextCompleted };
  }
};

export default function GroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, groupData } = useGroup();
  const { group, teams, members, loading, error } = groupData;
  const [hasMultipleGroups, setHasMultipleGroups] = useState(false);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  // Only fetch to check if user has multiple groups (lightweight)
  useEffect(() => {
    if (!user?.id) return;
    apiService.getUserGroups(user.id)
      .then((groups) => setHasMultipleGroups(groups.length > 1))
      .catch(() => {});
  }, [user?.id]);

  const leaderboardRankings = useMemo<GroupRankingItem[]>(() => {
    const teamByUserId = new Map(teams.map((t) => [t.userId, t]));

    let currentRank = 0;
    let previousPoints: number | null = null;

    return members
      .filter((m) => m.status === "ACCEPTED")
      .map((m) => ({ member: m, team: teamByUserId.get(m.user.id) }))
      .sort((a, b) => (b.team?.totalPoints ?? 0) - (a.team?.totalPoints ?? 0))
      .map(({ member, team }, index) => {
        const points = team?.totalPoints ?? 0;
        if (previousPoints === null || points !== previousPoints) {
          currentRank = index + 1;
          previousPoints = points;
        }
        return {
          rank: currentRank,
          teamName: team?.teamName ?? `Team ${member.user.username}`,
          username: member.user.username,
          avatarImage: team?.avatarImage,
          points,
          isYourTeam: user?.id === member.user.id,
          teamId: team?.id,
        };
      });
  }, [members, teams, user?.id]);

  const statusStyles = getStatusStyles(group?.status);

  if (loading) {
    if (!showLoadingSpinner) return <View style={styles.centerContainer} />;
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.centerText}>Loading group...</Text>
      </View>
    );
  }

  if (!selectedGroupId) {
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

  if (error || !group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? "Failed to load group."}</Text>
        <Button
          label="Try Again"
          variant="outline"
          size="md"
          onPress={() => router.replace("/(player)/group")}
          style={styles.centerButton}
          icon="refresh-outline"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard} padding="lg" shadow="medium">
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.seasonStatusRow}>
              <Text style={styles.seasonLabel} numberOfLines={1} ellipsizeMode="tail">
                {group.season.seasonName}
              </Text>
              <View style={[styles.statusBadge, statusStyles.badge]}>
                <Text style={[styles.statusText, statusStyles.text]}>
                  {formatGroupStatus(group.status)}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.detailsIconButton}
            onPress={() => router.push("/(player)/groups/details")}
            accessibilityRole="button"
            accessibilityLabel="Group details"
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {members.filter((m) => m.status === "ACCEPTED").length}
            </Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{group.draft?.teamSize ?? "-"}</Text>
            <Text style={styles.statLabel}>Team Size</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {group.latestEpisodeWatched?.episodeNumber
                ? `Ep ${group.latestEpisodeWatched.episodeNumber}`
                : "None"}
            </Text>
            <Text style={styles.statLabel}>Last Episode</Text>
          </View>
        </View>

        {hasMultipleGroups && (
          <Button
            label="Switch Groups"
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.push("/(player)/groups/select")}
            style={styles.switchButton}
            icon="swap-horizontal-outline"
          />
        )}
      </Card>

      <LeaderboardSection
        title="Leaderboard"
        rankings={leaderboardRankings}
        onTeamPress={(teamId) =>
          router.push({ pathname: "/(player)/teams/[teamId]", params: { teamId: String(teamId) } })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.secondaryBackground },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.secondaryBackground,
  },
  centerText: { color: Colors.textSecondary, fontSize: FontSizes.medium, textAlign: "center" },
  errorText: { color: Colors.warning, fontSize: FontSizes.medium, textAlign: "center" },
  centerButton: { marginTop: Spacing.md },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg },
  headerCard: { marginBottom: Spacing.md },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerText: { flex: 1 },
  groupName: { color: Colors.text, fontSize: FontSizes.xlarge, fontWeight: "800" },
  seasonStatusRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, marginTop: Spacing.xs },
  seasonLabel: { flex: 1, flexShrink: 1, minWidth: 0, color: Colors.textSecondary, fontSize: FontSizes.medium },
  detailsIconButton: { alignItems: "center", justifyContent: "center", padding: Spacing.xxs, marginLeft: Spacing.md },
  statusBadge: { alignSelf: "flex-start", flexShrink: 0, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  statusText: { fontSize: FontSizes.small, fontWeight: "700", letterSpacing: 0.5 },
  statusBadgeActive: { backgroundColor: Colors.successBackground },
  statusTextActive: { color: Colors.success },
  statusBadgePending: { backgroundColor: Colors.warningBackground },
  statusTextPending: { color: Colors.primary },
  statusBadgeDrafting: { backgroundColor: Colors.infoBackground },
  statusTextDrafting: { color: Colors.secondary },
  statusBadgeCompleted: { backgroundColor: Colors.lightBackground },
  statusTextCompleted: { color: Colors.textSecondary },
  headerStats: { flexDirection: "row", alignItems: "center" },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { color: Colors.text, fontSize: FontSizes.large, fontWeight: "800" },
  statLabel: { color: Colors.textSecondary, fontSize: FontSizes.small, marginTop: Spacing.xxs },
  statDivider: { backgroundColor: Colors.border, height: 32, width: 1 },
  switchButton: { marginTop: Spacing.md },
});
