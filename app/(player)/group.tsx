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
import apiService, {
  GroupMemberResponse,
  GroupResponse,
  TeamResponse,
} from "../../services/api";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Shadow,
  Spacing,
} from "../../constants/theme";
import { GroupRankingItem } from "../../components/player/HomeWidgets";
import LeaderboardSection from "../../components/player/LeaderboardSection";
import useDelayedLoader from "../../hooks/useDelayedLoader";

interface LeaderboardMember {
  id: number;
  username: string;
  teamName: string;
  points: number;
  isYou?: boolean;
  teamId?: number;
}

const formatGroupStatus = (status?: GroupResponse["status"]) => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "DRAFTING":
      return "Drafting";
    case "ACTIVE":
      return "Active";
    case "COMPLETED":
      return "Completed";
    default:
      return "Unknown";
  }
};

const getStatusStyles = (status?: GroupResponse["status"]) => {
  switch (status) {
    case "ACTIVE":
      return {
        badge: styles.statusBadgeActive,
        text: styles.statusTextActive,
      };
    case "PENDING":
      return {
        badge: styles.statusBadgePending,
        text: styles.statusTextPending,
      };
    case "DRAFTING":
      return {
        badge: styles.statusBadgeDrafting,
        text: styles.statusTextDrafting,
      };
    case "COMPLETED":
    default:
      return {
        badge: styles.statusBadgeCompleted,
        text: styles.statusTextCompleted,
      };
  }
};

export default function GroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId } = useGroup();
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleGroups, setHasMultipleGroups] = useState(false);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  useEffect(() => {
    const loadGroupData = async () => {
      if (!selectedGroupId) {
        setGroup(null);
        setMembers([]);
        setTeams([]);
        setHasMultipleGroups(false);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [groupData, groupMembers, groupTeams, userGroups] =
          await Promise.all([
            apiService.getGroupById(selectedGroupId),
            apiService.getGroupMembers(selectedGroupId),
            apiService.getTeamsByGroupId(selectedGroupId),
            user?.id ? apiService.getUserGroups(user.id) : Promise.resolve([]),
          ]);

        setGroup(groupData);
        setMembers(groupMembers);
        setTeams(groupTeams);
        setHasMultipleGroups(userGroups.length > 1);
      } catch (err) {
        console.error("Failed to load group page data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load group data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [selectedGroupId, user?.id]);

  const leaderboardMembers = useMemo<LeaderboardMember[]>(() => {
    const teamByUserId = new Map<number, TeamResponse>();

    teams.forEach((team) => {
      if (team.userId != null) {
        teamByUserId.set(team.userId, team);
      }
    });

    return members
      .filter((member) => member.status === "ACCEPTED")
      .map((member) => {
        const team = teamByUserId.get(member.user.id);
        return {
          id: member.user.id,
          username: member.user.username,
          teamName: team?.teamName ?? `Team ${member.user.username}`,
          points: team?.totalPoints ?? 0,
          isYou: user?.id === member.user.id,
          teamId: team?.id,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [members, teams, user?.id]);

  const leaderboardRankings = useMemo<GroupRankingItem[]>(() => {
    let currentRank = 0;
    let previousPoints: number | null = null;

    return leaderboardMembers.map((member, index) => {
      if (previousPoints === null || member.points !== previousPoints) {
        currentRank = index + 1;
        previousPoints = member.points;
      }

      return {
        rank: currentRank,
        teamName: member.teamName,
        username: member.username,
        avatarImage: teams.find((team) => team.id === member.teamId)?.avatarImage,
        points: member.points,
        isYourTeam: member.isYou,
        teamId: member.teamId,
      };
    });
  }, [leaderboardMembers]);

  const statusStyles = getStatusStyles(group?.status);

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

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
        <Text style={styles.centerText}>
          Select a group to view live standings.
        </Text>
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
      {/* Group Header */}
      <Card style={styles.headerCard} padding="lg" shadow="medium">
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.seasonStatusRow}>
              <Text
                style={styles.seasonLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
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
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{leaderboardMembers.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{group.teamSize ?? "-"}</Text>
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
        {hasMultipleGroups ? (
          <Button
            label="Switch Groups"
            variant="outline"
            size="md"
            fullWidth
            onPress={() => router.push("/(player)/groups/select")}
            style={styles.switchButton}
            icon="swap-horizontal-outline"
          />
        ) : null}
      </Card>

      {/* Leaderboard */}
      <LeaderboardSection
        title="Leaderboard"
        rankings={leaderboardRankings}
        onTeamPress={(teamId, isYourTeam) => {
          if (isYourTeam) {
            router.push({
              pathname: "/(player)/teams/[teamId]",
              params: { teamId: String(teamId) },
            });
            return;
          }

          router.push({
            pathname: "/(player)/teams/[teamId]",
            params: { teamId: String(teamId) },
          });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.secondaryBackground,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    textAlign: "center",
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
    textAlign: "center",
  },
  centerButton: {
    marginTop: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  // Header card
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  groupName: {
    color: Colors.text,
    fontSize: FontSizes.xlarge,
    fontWeight: "800",
  },
  seasonStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  seasonLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  detailsIconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxs,
    marginLeft: Spacing.md,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexShrink: 0,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusBadgeActive: {
    backgroundColor: Colors.successBackground,
  },
  statusTextActive: {
    color: Colors.success,
  },
  statusBadgePending: {
    backgroundColor: Colors.warningBackground,
  },
  statusTextPending: {
    color: Colors.primary,
  },
  statusBadgeDrafting: {
    backgroundColor: Colors.infoBackground,
  },
  statusTextDrafting: {
    color: Colors.secondary,
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.lightBackground,
  },
  statusTextCompleted: {
    color: Colors.textSecondary,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSizes.large,
    fontWeight: "800",
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xxs,
  },
  statDivider: {
    backgroundColor: Colors.border,
    height: 32,
    width: 1,
  },
  switchButton: {
    marginTop: Spacing.md,
  },
});
