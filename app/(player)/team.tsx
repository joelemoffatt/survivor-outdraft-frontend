import {
  Alert,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  useResponsive,
  BorderRadius,
  Colors,
  FontSizes,
  Shadow,
  Spacing,
} from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import apiService, {
  TeamResponse,
  GroupResponse,
  ScoreBreakdownResponse,
} from "../../services/api";
import DraftScreen from "../../components/player/DraftScreen";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import TeamView from "../../components/shared/team";
import useDelayedLoader from "../../hooks/useDelayedLoader";

export default function TeamScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const { user } = useAuth();
  const { selectedGroupId, setSelectedGroupId, groupsLoaded, userHasGroups } =
    useGroup();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [startingDraft, setStartingDraft] = useState(false);
  const [startDraftError, setStartDraftError] = useState<string | null>(null);
  const [draftComplete, setDraftComplete] = useState(false);
  const [selectingGroup, setSelectingGroup] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] =
    useState<ScoreBreakdownResponse | null>(null);
  const showDataLoadingSpinner = useDelayedLoader(loading, 200);
  const showGroupLoadingSpinner = useDelayedLoader(
    !selectedGroupId && !groupsLoaded,
    200,
  );
  const isGroupLeader = user
    ? Number(user.id) === Number(group?.admin?.id)
    : false;

  // Note: group auto-selection is handled centrally in GroupContext

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedGroupId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch group info
        const groupData = await apiService.getGroupById(selectedGroupId);
        setGroup(groupData);

        // Fetch team data
        const teamData = await apiService.getTeamByGroupAndUser(
          selectedGroupId,
          user.id,
        );
        setTeam(teamData);

        // Reset draftComplete if draft is still in progress
        if (groupData.status === "DRAFTING") {
          setDraftComplete(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError(err?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedGroupId]);

  // Fetch score breakdown when team is available
  useEffect(() => {
    if (!team) return;
    const fetchBreakdown = async () => {
      try {
        const breakdown = await apiService.getTeamScoreBreakdown(team.id);
        setScoreBreakdown(breakdown);
      } catch (err) {
        console.debug("Score breakdown not available yet:", err);
        setScoreBreakdown(null);
      }
    };
    fetchBreakdown();
  }, [team]);

  // Countdown timer for draft start
  useEffect(() => {
    const scheduledAt = group?.draft?.scheduledAt;
    if (!group || !scheduledAt || group.status !== "PENDING") {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const startTime = new Date(scheduledAt);
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Draft should start soon!");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [group]);

  // Poll for draft status changes while draft is PENDING
  useEffect(() => {
    if (!group || group.status !== "PENDING" || !selectedGroupId) {
      return;
    }

    const pollDraftStatus = async () => {
      try {
        const updatedGroup = await apiService.getGroupById(selectedGroupId);

        // If status changed from PENDING to DRAFTING, update state
        if (updatedGroup.status !== "PENDING" && group.status === "PENDING") {
          setGroup(updatedGroup);
        }
      } catch (err) {
        // Silently handle polling errors to avoid spam in console
        console.debug("Draft status poll failed:", err);
      }
    };

    // Poll every 3 seconds while waiting for draft
    const pollInterval = setInterval(pollDraftStatus, 3000);
    return () => clearInterval(pollInterval);
  }, [group, selectedGroupId]);

  const handleStartDraft = async () => {
    if (!selectedGroupId) return;

    try {
      setStartingDraft(true);
      setStartDraftError(null);
      await apiService.startDraft(selectedGroupId);

      // Refresh group data
      const groupData = await apiService.getGroupById(selectedGroupId);
      setGroup(groupData);
    } catch (err: any) {
      console.error("Failed to start draft:", err);
      const rawMessage = err?.message || "Unknown error";
      const isUnsafeDraftConfig = rawMessage.includes(
        "Unsafe draft configuration",
      );

      if (isUnsafeDraftConfig) {
        const friendlyMessage =
          "This draft setup can leave someone with no legal pick. " +
          "Try lowering team size or choosing a less advanced watched episode.";
        setStartDraftError(friendlyMessage);
        Alert.alert(
          "Cannot Start Draft",
          `${friendlyMessage}\n\nDetails: ${rawMessage}`,
        );
      } else {
        setStartDraftError(rawMessage);
        Alert.alert("Failed to start draft", rawMessage);
      }
    } finally {
      setStartingDraft(false);
    }
  };

  if (!selectedGroupId) {
    if (!groupsLoaded) {
      if (!showGroupLoadingSpinner) {
        return <View style={styles.centerContainer} />;
      }

      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.infoText}>Loading groups...</Text>
        </View>
      );
    }

    if (groupsLoaded && !userHasGroups) {
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

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading groups...</Text>
      </View>
    );
  }

  if (loading) {
    if (!showDataLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!team || !group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>No team found for this group</Text>
      </View>
    );
  }

  // BEFORE DRAFT - Show countdown
  if (group.status === "PENDING") {
    const isAdmin = isGroupLeader;

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <Card style={styles.headerCard} shadow="medium">
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.teamName}>{team.teamName}</Text>
              <View style={styles.seasonStatusRow}>
                <Text
                  style={styles.seasonLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {group.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.detailsIconButton}
              onPress={() => router.push("/(player)/groups/edit-team")}
              accessibilityRole="button"
              accessibilityLabel="Edit teams"
            >
              <Ionicons
                name="pencil-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {scoreBreakdown?.totalPoints ?? team.totalPoints}
              </Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.draftInfoCard} shadow="light">
          <Text style={styles.draftInfoTitle}>Draft Coming Soon!</Text>

          {group.draft?.scheduledAt && (
            <View style={styles.countdownSection}>
              <Text style={styles.countdownLabel}>Draft starts in:</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownSubtext}>
                {new Date(group.draft.scheduledAt).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.draftDetailsSection}>
            <View style={styles.draftDetail}>
              <Text style={styles.draftDetailLabel}>Team Size</Text>
              <Text style={styles.draftDetailValue}>
                {group.teamSize || "?"} players
              </Text>
            </View>
            <View style={styles.draftDetail}>
              <Text style={styles.draftDetailLabel}>Group</Text>
              <Text style={styles.draftDetailValue}>{group.name}</Text>
            </View>
          </View>

          {isAdmin && (
            <>
              <Button
                label="Start Draft Now"
                variant="primary"
                size="lg"
                onPress={handleStartDraft}
                loading={startingDraft}
                style={styles.startButton}
              />
              {startDraftError && (
                <Text style={styles.startDraftErrorText}>
                  {startDraftError}
                </Text>
              )}
            </>
          )}

          {!isAdmin && (
            <Text style={styles.adminNote}>
              The draft will be started by {group.admin.username}
            </Text>
          )}
        </Card>
      </ScrollView>
    );
  }

  // DURING DRAFT - Show draft UI
  if (group.status === "DRAFTING" && !draftComplete) {
    return (
      <DraftScreen
        groupId={selectedGroupId}
        teamSize={group.teamSize || 5}
        onDraftComplete={async () => {
          try {
            // Refresh group + team data when draft completes
            const groupData = await apiService.getGroupById(selectedGroupId);
            setGroup(groupData);

            if (user) {
              const teamData = await apiService.getTeamByGroupAndUser(
                selectedGroupId,
                user.id,
              );
              setTeam(teamData);
            }

            setDraftComplete(true);
          } catch (err: any) {
            console.error("Failed to refresh team after draft complete:", err);
            setError(err?.message || "Failed to refresh team data");
          }
        }}
      />
    );
  }

  // AFTER DRAFT - Show your team and all teams in the group
  return (
    <TeamView
      team={team}
      group={group}
      scoreBreakdown={scoreBreakdown}
      isOwnTeam
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    textAlign: "center",
  },
  centerButton: {
    marginTop: Spacing.md,
  },
  headerCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.medium,
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
  headerSection: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  teamName: {
    color: Colors.text,
    fontSize: FontSizes.xlarge,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
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
  headerStats: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  statItem: {
    alignItems: "flex-start",
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSizes.xxlarge,
    fontWeight: "800",
    lineHeight: 42,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    marginTop: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalPointsLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  totalPoints: {
    fontSize: FontSizes.title,
    fontWeight: "800",
    color: Colors.text,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
  },
  membersCard: {
    marginBottom: 0,
  },
  memberRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberRowBorder: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberUsername: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "600",
  },
  memberPick: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: "600",
    marginLeft: Spacing.md,
  },
  memberPointsButton: {
    marginLeft: "auto",
    paddingVertical: Spacing.xs,
  },
  memberPoints: {
    color: Colors.primary,
    fontSize: FontSizes.medium,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.dark,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalList: {
    flexGrow: 0,
  },
  scoreEventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreEventLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  scoreEventEpisode: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    width: 44,
  },
  scoreEventLabel: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  scoreEventPoints: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  modalClose: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    ...Shadow.light,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  castawayInfo: {
    flex: 1,
  },
  draftOrder: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  castawayName: {
    fontSize: FontSizes.medium,
    fontWeight: "600",
    color: Colors.text,
  },
  pointsDisplay: {
    alignItems: "flex-end",
  },
  points: {
    fontSize: FontSizes.medium,
    fontWeight: "700",
    color: "#fff",
  },
  pointsLabel: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
  },
  infoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: Colors.warning,
    textAlign: "center",
  },
  // Draft-specific styles
  draftStatusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  draftingStatus: {
    color: "#ff6b35",
  },
  draftInfoCard: {
    backgroundColor: Colors.infoBackground,
    marginBottom: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.light,
  },
  draftInfoTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  countdownSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.light,
  },
  countdownLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countdownValue: {
    fontSize: FontSizes.title,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  countdownSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  draftDetailsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  draftDetail: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.light,
  },
  draftDetailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  draftDetailValue: {
    fontSize: FontSizes.medium,
    fontWeight: "700",
    color: Colors.primary,
  },
  startButton: {
    marginTop: Spacing.xl,
    minWidth: 220,
  },
  startDraftErrorText: {
    marginTop: Spacing.sm,
    color: Colors.warning,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  adminNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    fontStyle: "italic",
    textAlign: "center",
  },
  groupTeamsSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  teamCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  yourTeamCard: {
    backgroundColor: "#e8f4f8",
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  teamCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  teamCardName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  teamRosterCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  teamCardRoster: {
    gap: Spacing.xs,
  },
  teamCardCastaway: {
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 2,
  },
});
