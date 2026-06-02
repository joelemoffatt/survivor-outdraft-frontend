import {
  Alert,
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AppLoader from "../../components/shared/AppLoader";
import GroupLoadingScreen from "../../components/shared/GroupLoadingScreen";
import CreateOrJoinGroup from "../../components/shared/CreateOrJoinGroup";
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
import { Castaway } from "../../types/survivor";
import AvatarCircle from "../../components/shared/AvatarCircle";
import { getImportedCastawayImageSource } from "../../utils/castawayImages";
import DraftScreen from "../../components/player/DraftScreen";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import TeamView from "../../components/shared/team";
import useDelayedLoader from "../../hooks/useDelayedLoader";

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, groupsLoaded, userHasGroups, groupData, refreshGroupData } = useGroup();
  const { group, myTeam: team, members, loading, error } = groupData;

  const [countdown, setCountdown] = useState<string>("");
  const [startingDraft, setStartingDraft] = useState(false);
  const [startDraftError, setStartDraftError] = useState<string | null>(null);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [addMemberUsername, setAddMemberUsername] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [castaways, setCastaways] = useState<Castaway[]>([]);
  const [castawaysLoading, setCastawaysLoading] = useState(false);

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
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateCountdown = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting soon!"); return; }
      if (diff < 5 * 60 * 1000) {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${m}m ${s}s`);
        timeoutId = setTimeout(updateCountdown, 1000);
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);
        setCountdown(parts.join(" "));
        // schedule next tick at the top of the next minute
        const msUntilNextMinute = 60000 - (diff % 60000);
        timeoutId = setTimeout(updateCountdown, msUntilNextMinute);
      }
    };
    updateCountdown();
    return () => clearTimeout(timeoutId);
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
    const interval = setInterval(poll, 120000);
    return () => clearInterval(interval);
  }, [group?.status, selectedGroupId, refreshGroupData]);

  useEffect(() => {
    const seasonId = group?.season?.id;
    if (!seasonId || group?.status !== "PENDING") return;
    setCastawaysLoading(true);
    apiService.getCastaways(seasonId)
      .then(setCastaways)
      .catch(() => {})
      .finally(() => setCastawaysLoading(false));
  }, [group?.season?.id, group?.status]);

  const handleAddMember = async () => {
    if (!selectedGroupId || !addMemberUsername.trim()) return;
    try {
      setAddMemberLoading(true);
      await apiService.inviteByUsername(selectedGroupId, addMemberUsername.trim());
      setAddMemberUsername("");
      setAddMemberModalVisible(false);
      await refreshGroupData();
    } catch (err: any) {
      Alert.alert("Invite Failed", err?.message ?? "Could not invite user.");
    } finally {
      setAddMemberLoading(false);
    }
  };

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
      return <AppLoader />;
    }
    if (userHasGroups === false) {
      return <CreateOrJoinGroup />;
    }
    return <AppLoader />;
  }

  if (loading) {
    if (!showDataLoadingSpinner) return <View style={styles.centerContainer} />;
    return <AppLoader />;
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

  if (group.loading) {
    return <GroupLoadingScreen loadingText={group.loadingText} />;
  }

  // BEFORE DRAFT
  if (group.status === "PENDING") {
    return (
      <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.draftInfoCard} shadow="medium">
          <View style={styles.draftInfoHeader}>
            <Text style={styles.draftInfoTitle}>Draft Coming Soon</Text>
            <Text style={styles.draftInfoSubtitle}>{group.name}</Text>
          </View>

          <View style={styles.draftStatRow}>
            <View style={styles.draftStat}>
              <Text style={styles.draftStatValue}>{group.draft?.teamSize ?? "—"}</Text>
              <Text style={styles.draftStatLabel}>Team Size</Text>
            </View>
            <View style={styles.draftStatDivider} />
            <View style={styles.draftStat}>
              <Text style={styles.draftStatValue}>
                {members.filter((m) => m.status === "ACCEPTED").length}
              </Text>
              <Text style={styles.draftStatLabel}>Members</Text>
            </View>
            {group.draft?.scheduledAt && (
              <>
                <View style={styles.draftStatDivider} />
                <View style={styles.draftStat}>
                  <Text style={styles.draftStatValue}>
                    {new Date(group.draft.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                  <Text style={styles.draftStatLabel}>Draft Date</Text>
                </View>
              </>
            )}
          </View>

          {group.draft?.scheduledAt && countdown ? (
            <View style={styles.countdownRow}>
              <Text style={styles.countdownLabel}>Starts in</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
            </View>
          ) : null}

          {(() => {
            const acceptedCount = members.filter((m) => m.status === "ACCEPTED").length;
            const canStartDraft = acceptedCount >= 2;
            if (isGroupLeader) {
              return canStartDraft ? (
                <>
                  <Button
                    label="Start Draft Now"
                    variant="primary"
                    size="lg"
                    onPress={handleStartDraft}
                    loading={startingDraft}
                    style={styles.startButton}
                    fullWidth
                  />
                  {startDraftError && (
                    <Text style={styles.startDraftErrorText}>{startDraftError}</Text>
                  )}
                </>
              ) : (
                <>
                  <Button
                    label="Add Group Members"
                    variant="outline"
                    size="lg"
                    onPress={() => setAddMemberModalVisible(true)}
                    style={styles.startButton}
                    icon="person-add-outline"
                    fullWidth
                  />
                  <Text style={styles.adminNote}>
                    At least 2 members are needed to start the draft.
                  </Text>
                </>
              );
            }
            return (
              <Text style={styles.adminNote}>
                The draft will be started by {group.admin.username}
              </Text>
            );
          })()}
        </Card>

        <View style={styles.exploreSection}>
          <Text style={styles.exploreSectionTitle}>Castaways</Text>
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
      </ScrollView>

      <Modal
        visible={addMemberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAddMemberModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                value={addMemberUsername}
                onChangeText={setAddMemberUsername}
                placeholder="Enter username"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.modalAddButton, (!addMemberUsername.trim() || addMemberLoading) && styles.modalAddButtonDisabled]}
                onPress={handleAddMember}
                disabled={!addMemberUsername.trim() || addMemberLoading}
              >
                <Text style={styles.modalAddButtonText}>{addMemberLoading ? "Inviting..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      </>
    );
  }

  // DURING DRAFT
  if (group.status === "DRAFTING") {
    return (
      <DraftScreen
        groupId={selectedGroupId}
        teamSize={group.draft?.teamSize || 5}
        onDraftComplete={refreshGroupData}
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
  draftInfoCard: { marginBottom: Spacing.md },
  draftInfoHeader: { marginBottom: Spacing.lg },
  draftInfoTitle: { fontSize: FontSizes.xlarge, fontWeight: "800", color: Colors.text },
  draftInfoSubtitle: { fontSize: FontSizes.medium, color: Colors.textSecondary, marginTop: Spacing.xs },
  draftStatRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  draftStat: { flex: 1, alignItems: "center" },
  draftStatValue: { fontSize: FontSizes.large, fontWeight: "800", color: Colors.text },
  draftStatLabel: { fontSize: FontSizes.small, color: Colors.textSecondary, marginTop: Spacing.xxs, textTransform: "uppercase", letterSpacing: 0.3 },
  draftStatDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  countdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: Colors.lightBackground, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  countdownLabel: { fontSize: FontSizes.small, color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  countdownValue: { fontSize: FontSizes.large, fontWeight: "800", color: Colors.primary },
  startButton: { marginTop: Spacing.sm },
  startDraftErrorText: { marginTop: Spacing.sm, color: Colors.warning, textAlign: "center", fontSize: 14, lineHeight: 20 },
  adminNote: { fontSize: FontSizes.small, color: Colors.textSecondary, marginTop: Spacing.md, fontStyle: "italic", textAlign: "center" },
  exploreSection: { marginTop: Spacing.lg },
  exploreSectionTitle: { color: Colors.text, fontSize: FontSizes.medium, fontWeight: "700", letterSpacing: 0.3, marginBottom: Spacing.sm, textTransform: "uppercase" },
  skeletonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, marginRight: Spacing.sm },
  skeletonName: { height: 14, width: "55%", borderRadius: 4, backgroundColor: Colors.border, marginBottom: 6 },
  skeletonDetail: { height: 11, width: "75%", borderRadius: 4, backgroundColor: Colors.lightBackground },
  exploreRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  exploreRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  exploreAvatar: { marginRight: Spacing.sm },
  exploreRowText: { flex: 1 },
  exploreName: { color: Colors.text, fontSize: FontSizes.medium, fontWeight: "600" },
  exploreDetail: { color: Colors.textSecondary, fontSize: FontSizes.small, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSizes.large, fontWeight: "700", color: Colors.text },
  modalBody: { padding: Spacing.lg, gap: Spacing.md },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  modalAddButton: {
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddButtonText: { fontSize: FontSizes.medium, fontWeight: "600", color: "#fff" },
});
