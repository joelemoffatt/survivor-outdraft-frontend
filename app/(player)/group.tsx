import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Card from "../../components/shared/Card";
import Button from "../../components/shared/Button";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Shadow,
  Spacing,
} from "../../constants/theme";

interface GroupMember {
  id: number;
  username: string;
  teamName: string;
  points: number;
  isYou?: boolean;
}

const MOCK_GROUP_NAME = "Island Rivals";
const MOCK_SEASON = "Survivor 50";
const MOCK_STATUS = "IN PROGRESS";
const MOCK_TEAM_SIZE = 4;

const MOCK_MEMBERS: GroupMember[] = [
  {
    id: 1,
    username: "joelmoffatt",
    teamName: "Outlast Alliance",
    points: 186,
    isYou: true,
  },
  {
    id: 2,
    username: "sarah_j",
    teamName: "Hidden Immunity Idols",
    points: 212,
  },
  { id: 3, username: "mike_r", teamName: "Torch Snuffers", points: 199 },
  { id: 4, username: "dana_k", teamName: "Camp Chaos", points: 171 },
  { id: 5, username: "alex_t", teamName: "Tribal Council Kings", points: 160 },
];

export default function GroupScreen() {
  const router = useRouter();
  const leaderboardMembers = [...MOCK_MEMBERS].sort((a, b) => b.points - a.points);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Group Header */}
      <Card style={styles.headerCard} padding="lg" shadow="medium">
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.groupName}>{MOCK_GROUP_NAME}</Text>
            <View style={styles.seasonStatusRow}>
              <Text style={styles.seasonLabel}>{MOCK_SEASON}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{MOCK_STATUS}</Text>
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
            <Text style={styles.statValue}>{MOCK_MEMBERS.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{MOCK_TEAM_SIZE}</Text>
            <Text style={styles.statLabel}>Team Size</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Ep 2</Text>
            <Text style={styles.statLabel}>Last Episode</Text>
          </View>
        </View>
        <Button
          label="Switch Groups"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.push("/(player)/groups/select")}
          style={styles.switchButton}
          icon="swap-horizontal-outline"
        />
      </Card>

      {/* Leaderboard */}
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      <Card style={styles.membersCard} padding="sm" shadow="light">
        {leaderboardMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.memberRow,
              member.isYou && styles.youRow,
              index < leaderboardMembers.length - 1 && styles.memberRowBorder,
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={[styles.avatar, member.isYou && styles.avatarYou]}>
              <Text style={[styles.avatarText, member.isYou && styles.avatarTextYou]}>
                {member.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={[styles.memberUsername, member.isYou && styles.youText]}>
                {member.username}
                {member.isYou ? " (you)" : ""}
              </Text>
              <Text style={styles.memberTeam}>{member.teamName}</Text>
            </View>
            <Text style={[styles.memberPoints, member.isYou && styles.youText]}>
              {member.points} pts
            </Text>
          </View>
        ))}
      </Card>
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

  // Header card
  headerCard: {
    marginBottom: Spacing.lg,
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
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  seasonLabel: {
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
    backgroundColor: Colors.successBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    color: Colors.success,
    fontSize: FontSizes.small,
    fontWeight: "700",
    letterSpacing: 0.5,
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

  // Section title
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
  },

  // Actions row
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flex: 1,
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    ...Shadow.light,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: "600",
  },

  // Members
  membersCard: {
    marginBottom: 0,
  },
  rankBadge: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    marginRight: Spacing.sm,
  },
  rankText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    fontWeight: "700",
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
  youRow: {
    backgroundColor: Colors.warningBackground,
    borderRadius: BorderRadius.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    borderRadius: BorderRadius.full,
    height: 38,
    justifyContent: "center",
    marginRight: Spacing.md,
    width: 38,
  },
  avatarYou: {
    backgroundColor: Colors.primary,
  },
  avatarText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    fontWeight: "700",
  },
  avatarTextYou: {
    color: Colors.background,
  },
  memberInfo: {
    flex: 1,
  },
  memberUsername: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "600",
  },
  memberTeam: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    marginTop: Spacing.xxs,
  },
  memberPoints: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "700",
  },
  youText: {
    color: Colors.primary,
  },
});
