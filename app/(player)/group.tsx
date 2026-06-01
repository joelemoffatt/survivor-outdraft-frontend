import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppLoader from "../../components/shared/AppLoader";
import CreateOrJoinGroup from "../../components/shared/CreateOrJoinGroup";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import apiService, { GroupMemberResponse, GroupResponse } from "../../services/api";
import AvatarCircle from "../../components/shared/AvatarCircle";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
} from "../../constants/theme";
import { GroupRankingItem } from "../../components/player/HomeWidgets";
import LeaderboardSection from "../../components/player/LeaderboardSection";
import useDelayedLoader from "../../hooks/useDelayedLoader";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

const formatDraftDate = (iso: string) => {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${ordinal(d.getDate())}`;
};

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

export default function GroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId, groupsLoaded, userHasGroups, groupData, refreshGroupData } = useGroup();
  const { group, teams, members, loading, error } = groupData;
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [addMemberUsername, setAddMemberUsername] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const isGroupLeader = user ? Number(user.id) === Number(group?.admin?.id) : false;
  const showLoadingSpinner = useDelayedLoader(loading, 200);

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
    return <AppLoader />;
  }

  if (!selectedGroupId) {
    if (!groupsLoaded) return <AppLoader />;
    if (!userHasGroups) return <CreateOrJoinGroup />;
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
            onPress={() =>
              isGroupLeader
                ? router.push(`/(player)/groups/manage/${group.id}`)
                : router.push("/(player)/groups/details")
            }
            accessibilityRole="button"
            accessibilityLabel={isGroupLeader ? "Edit group" : "Group details"}
          >
            <Ionicons
              name={isGroupLeader ? "pencil-outline" : "information-circle-outline"}
              size={20}
              color={Colors.primary}
            />
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
            {group.status === "PENDING" ? (
              <>
                <Text style={styles.statValue}>
                  {group.draft?.scheduledAt
                    ? formatDraftDate(group.draft.scheduledAt)
                    : "TBD"}
                </Text>
                <Text style={styles.statLabel}>Draft Date</Text>
              </>
            ) : (
              <>
                <Text style={styles.statValue}>
                  {group.latestEpisodeWatched?.episodeNumber
                    ? `Ep ${group.latestEpisodeWatched.episodeNumber}`
                    : "None"}
                </Text>
                <Text style={styles.statLabel}>Last Episode</Text>
              </>
            )}
          </View>
        </View>


      </Card>

      {group.status === "PENDING" ? (
        <View style={styles.memberListSection}>
          <Text style={styles.sectionTitle}>Members</Text>
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
                  <AvatarCircle
                    size={34}
                    fallbackText={m.user.username}
                    style={styles.memberAvatar}
                  />
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
            {isGroupLeader && (
              <TouchableOpacity
                style={styles.addMemberRow}
                onPress={() => setAddMemberModalVisible(true)}
              >
                <View style={styles.addMemberIcon}>
                  <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.addMemberText}>Add Member</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>
      ) : (
        <LeaderboardSection
          title="Leaderboard"
          rankings={leaderboardRankings}
          onTeamPress={(teamId) =>
            router.push({ pathname: "/(player)/teams/[teamId]", params: { teamId: String(teamId) } })
          }
        />
      )}

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
  addMembersButton: { marginTop: Spacing.md },
  memberListSection: { width: "100%" },
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
  addMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  addMemberIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.lightBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  addMemberText: { color: Colors.primary, fontSize: FontSizes.medium, fontWeight: "600" },
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
