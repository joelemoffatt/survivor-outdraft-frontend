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
  BorderRadius,
  Colors,
  FontSizes,
  Shadow,
  Spacing,
} from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import apiService, { deriveScoreBreakdown } from "../../services/api";
import DraftScreen from "../../components/player/DraftScreen";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import TeamView from "../../components/shared/team";
import useDelayedLoader from "../../hooks/useDelayedLoader";

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, groupsLoaded, userHasGroups, groupData, refreshGroupData } = useGroup();
  const { group, myTeam: team, loading, error } = groupData;

  const [countdown, setCountdown] = useState<string>("");
  const [startingDraft, setStartingDraft] = useState(false);
  const [startDraftError, setStartDraftError] = useState<string | null>(null);
  const [draftComplete, setDraftComplete] = useState(false);

  const showDataLoadingSpinner = useDelayedLoader(loading, 200);
  const showGroupLoadingSpinner = useDelayedLoader(!selectedGroupId && !groupsLoaded, 200);
  const isGroupLeader = user ? Number(user.id) === Number(group?.admin?.id) : false;

  // Countdown timer for draft start
  useEffect(() => {
    const scheduledAt = group?.draft?.scheduledAt;
    if (!group || !scheduledAt || group.status !== "PENDING") {
      setCountdown("");
      return;
    }
    const updateCountdown = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Draft should start soon!"); return; }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [group?.draft?.scheduledAt, group?.status]);

  // Poll group status while PENDING — lightweight check, full refresh on status change
  useEffect(() => {
    if (!group || group.status !== "PENDING" || !selectedGroupId) return;
    const poll = async () => {
      try {
        const updated = await apiService.getGroupById(selectedGroupId, { forceRefresh: true });
        if (updated.status !== "PENDING") {
          await refreshGroupData();
        }
      } catch {
        // ignore poll errors
      }
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [group?.status, selectedGroupId, refreshGroupData]);

  const handleStartDraft = async () => {
    if (!selectedGroupId) return;
    try {
      setStartingDraft(true);
      setStartDraftError(null);
      await apiService.startDraft(selectedGroupId);
      await refreshGroupData();
    } catch (err: any) {
      const rawMessage = err?.message || "Unknown error";
      const isUnsafe = rawMessage.includes("Unsafe draft configuration");
      const friendlyMessage = isUnsafe
        ? "This draft setup can leave someone with no legal pick. Try lowering team size or choosing a less advanced watched episode."
        : rawMessage;
      setStartDraftError(friendlyMessage);
      Alert.alert("Cannot Start Draft", isUnsafe ? `${friendlyMessage}\n\nDetails: ${rawMessage}` : rawMessage);
    } finally {
      setStartingDraft(false);
    }
  };

  if (!selectedGroupId) {
    if (!groupsLoaded) {
      if (!showGroupLoadingSpinner) return <View style={styles.centerContainer} />;
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.infoText}>Loading groups...</Text>
        </View>
      );
    }
    if (userHasGroups === false) {
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
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.infoText}>Loading groups...</Text>
      </View>
    );
  }

  if (loading) {
    if (!showDataLoadingSpinner) return <View style={styles.centerContainer} />;
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

  // BEFORE DRAFT
  if (group.status === "PENDING") {
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.headerCard} shadow="medium">
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.teamName}>{team.teamName}</Text>
              <View style={styles.seasonStatusRow}>
                <Text style={styles.seasonLabel} numberOfLines={1} ellipsizeMode="tail">
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
              <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{team.totalPoints}</Text>
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
              <Text style={styles.draftDetailValue}>{group.draft?.teamSize || "?"} players</Text>
            </View>
            <View style={styles.draftDetail}>
              <Text style={styles.draftDetailLabel}>Group</Text>
              <Text style={styles.draftDetailValue}>{group.name}</Text>
            </View>
          </View>
          {isGroupLeader ? (
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
                <Text style={styles.startDraftErrorText}>{startDraftError}</Text>
              )}
            </>
          ) : (
            <Text style={styles.adminNote}>
              The draft will be started by {group.admin.username}
            </Text>
          )}
        </Card>
      </ScrollView>
    );
  }

  // DURING DRAFT
  if (group.status === "DRAFTING" && !draftComplete) {
    return (
      <DraftScreen
        groupId={selectedGroupId}
        teamSize={group.draft?.teamSize || 5}
        onDraftComplete={async () => {
          await refreshGroupData();
          setDraftComplete(true);
        }}
      />
    );
  }

  // AFTER DRAFT
  return (
    <TeamView
      team={team}
      group={group}
      scoreBreakdown={deriveScoreBreakdown(team)}
      isOwnTeam
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: Colors.secondaryBackground },
  contentContainer: { padding: Spacing.lg },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: { color: Colors.textSecondary, fontSize: FontSizes.medium, textAlign: "center" },
  centerButton: { marginTop: Spacing.md },
  headerCard: { marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.medium },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: Spacing.lg },
  headerText: { flex: 1 },
  teamName: { color: Colors.text, fontSize: FontSizes.xlarge, fontWeight: "800" },
  seasonStatusRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, marginTop: Spacing.xs },
  seasonLabel: { flex: 1, flexShrink: 1, minWidth: 0, color: Colors.textSecondary, fontSize: FontSizes.medium },
  detailsIconButton: { alignItems: "center", justifyContent: "center", padding: Spacing.xxs, marginLeft: Spacing.md },
  headerStats: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  statItem: { alignItems: "flex-start" },
  statValue: { color: Colors.text, fontSize: FontSizes.xxlarge, fontWeight: "800", lineHeight: 42 },
  statLabel: { color: Colors.textSecondary, fontSize: FontSizes.medium, marginTop: Spacing.xs, textTransform: "uppercase", letterSpacing: 0.4 },
  infoText: { fontSize: 16, color: Colors.textSecondary, textAlign: "center" },
  errorText: { fontSize: 16, color: Colors.warning, textAlign: "center" },
  draftInfoCard: { backgroundColor: Colors.infoBackground, marginBottom: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border, ...Shadow.light },
  draftInfoTitle: { fontSize: 24, fontWeight: "700", color: Colors.primary, marginBottom: Spacing.lg, textAlign: "center" },
  countdownSection: { alignItems: "center", marginVertical: Spacing.xl, padding: Spacing.lg, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, width: "100%", borderWidth: 1, borderColor: Colors.border, ...Shadow.light },
  countdownLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  countdownValue: { fontSize: FontSizes.title, fontWeight: "800", color: Colors.primary, marginBottom: Spacing.sm },
  countdownSubtext: { fontSize: 12, color: Colors.textSecondary },
  draftDetailsSection: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: Spacing.lg, gap: Spacing.md },
  draftDetail: { flex: 1, alignItems: "center", padding: Spacing.md, backgroundColor: Colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.light },
  draftDetailLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: "uppercase" },
  draftDetailValue: { fontSize: FontSizes.medium, fontWeight: "700", color: Colors.primary },
  startButton: { marginTop: Spacing.xl, minWidth: 220 },
  startDraftErrorText: { marginTop: Spacing.sm, color: Colors.warning, textAlign: "center", fontSize: 14, lineHeight: 20 },
  adminNote: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.lg, fontStyle: "italic", textAlign: "center" },
});
