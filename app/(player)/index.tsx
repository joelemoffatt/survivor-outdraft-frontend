import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { useGroup } from "../../contexts/GroupContext";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
} from "../../constants/theme";
import apiService, { GroupResponse, TeamResponse } from "../../services/api";
import {
  GroupRankingItem,
  LastEpisodeWidget,
  TeamPointsWidget,
} from "../../components/player/HomeWidgets";
import LeaderboardSection from "../../components/player/LeaderboardSection";
import Button from "../../components/shared/Button";
import useDelayedLoader from "../../hooks/useDelayedLoader";

const responsiveMinHeight = 280;
const APP_MODE = process.env.EXPO_PUBLIC_APP_MODE ?? "development";
const SHOW_SESSION_DEBUG = APP_MODE === "development";

export default function PlayerHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    user,
    isLoggedIn,
    token,
    isLoading: authLoading,
    isAdminView,
  } = useAuth();
  const { selectedGroupId, groupsLoaded, userHasGroups } = useGroup();
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [groupRankings, setGroupRankings] = useState<GroupRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);
  const [sessionDebug, setSessionDebug] = useState({
    nowIso: "",
    storedTokenPresent: false,
    storedUserPresent: false,
    storedAdminViewValue: "",
    storedSessionStartedAt: "",
    sessionAgeSeconds: "",
  });

  useEffect(() => {
    const readSessionDebug = async () => {
      try {
        const [
          storedToken,
          storedUser,
          storedAdminView,
          storedSessionStartedAt,
        ] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_user"),
          AsyncStorage.getItem("admin_view_enabled"),
          AsyncStorage.getItem("session_started_at"),
        ]);

        const now = new Date();
        const startedAtMs = storedSessionStartedAt
          ? Number(storedSessionStartedAt)
          : NaN;
        const ageSeconds = Number.isFinite(startedAtMs)
          ? Math.max(Math.floor((now.getTime() - startedAtMs) / 1000), 0)
          : null;

        setSessionDebug({
          nowIso: now.toISOString(),
          storedTokenPresent: Boolean(storedToken),
          storedUserPresent: Boolean(storedUser),
          storedAdminViewValue: storedAdminView ?? "null",
          storedSessionStartedAt: storedSessionStartedAt ?? "null",
          sessionAgeSeconds: ageSeconds == null ? "n/a" : String(ageSeconds),
        });
      } catch (storageError) {
        setSessionDebug((previous) => ({
          ...previous,
          nowIso: new Date().toISOString(),
          sessionAgeSeconds: "error",
        }));
      }
    };

    readSessionDebug();
    const interval = setInterval(readSessionDebug, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isLoggedIn, token, user?.id, isAdminView]);

  useEffect(() => {
    const loadHomeData = async () => {
      if (!user?.id || !selectedGroupId) {
        setGroup(null);
        setTeam(null);
        setGroupRankings([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [groupData, userTeam, teams] = await Promise.all([
          apiService.getGroupById(selectedGroupId),
          apiService.getTeamByGroupAndUser(selectedGroupId, user.id),
          apiService.getTeamsByGroupId(selectedGroupId),
        ]);

        setGroup(groupData);
        setTeam(userTeam);

        let currentRank = 0;
        let previousPoints: number | null = null;

        const rankings = [...teams]
          .sort((first, second) => second.totalPoints - first.totalPoints)
          .map((teamItem, index) => {
            if (
              previousPoints === null ||
              teamItem.totalPoints !== previousPoints
            ) {
              currentRank = index + 1;
              previousPoints = teamItem.totalPoints;
            }
            const matchingMember = groupData.admin; // This is a placeholder; ideally we'd match via group members
            return {
              rank: currentRank,
              teamName: teamItem.teamName,
              username: teamItem.teamName.replace("Team ", ""),
              points: teamItem.totalPoints,
              isYourTeam: teamItem.id === userTeam.id,
              teamId: teamItem.id,
            };
          });

        setGroupRankings(rankings);
      } catch (loadError) {
        console.error("Failed to load home page data:", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load home data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [selectedGroupId, user?.id]);

  const displaySeasonNumber = useMemo(() => {
    if (!group) {
      return null;
    }

    const match = group.season.seasonName.match(/\d+/);
    return match ? Number(match[0]) : group.season.id;
  }, [group]);

  const lastEpisodeNumber = group?.latestEpisodeWatched?.episodeNumber ?? null;
  const hasLastEpisode =
    displaySeasonNumber != null && lastEpisodeNumber != null;

  const lastEpisodeLabel = hasLastEpisode
    ? `S${displaySeasonNumber} EP${lastEpisodeNumber}`
    : "--";

  const isWideDashboard = width >= 1100;

  const handleOpenLastEpisode = () => {
    if (!group?.latestEpisodeWatched?.episodeNumber) {
      return;
    }

    router.push({
      pathname: "/(player)/history/season/[season]/episode/[episode]",
      params: {
        season: String(group.season.id),
        episode: String(group.latestEpisodeWatched.episodeNumber),
      },
    });
  };

  const handleOpenTeam = (teamId: number, isYourTeam?: boolean) => {
    if (isYourTeam) {
      router.push({
        pathname: "/(player)/teams/[teamId]",
        params: {
          teamId: String(teamId),
        },
      });
      return;
    }

    router.push({
      pathname: "/(player)/teams/[teamId]",
      params: {
        teamId: String(teamId),
      },
    });
  };

  if (!selectedGroupId) {
    if (!groupsLoaded) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>
            Select a group to see your live home dashboard.
          </Text>
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
        <Text style={styles.centerText}>
          Select a group to see your live home dashboard.
        </Text>
      </View>
    );
  }

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.centerText}>Loading home data...</Text>
      </View>
    );
  }

  if (error || !group || !team) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error ?? "Failed to load home data."}
        </Text>
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
        <View
          style={[
            styles.widgetsColumn,
            isWideDashboard && styles.widgetsColumnWide,
          ]}
        >
          <LastEpisodeWidget
            label={lastEpisodeLabel}
            onPress={hasLastEpisode ? handleOpenLastEpisode : undefined}
            style={
              isWideDashboard ? styles.stackedWidget : styles.topWidgetLeft
            }
          />
          <TeamPointsWidget
            totalPoints={team.totalPoints}
            onPress={() => router.push("/(player)/team")}
            style={isWideDashboard ? styles.stackedWidget : styles.topWidget}
          />
        </View>

        <LeaderboardSection
          title="Leaderboard"
          rankings={groupRankings}
          onTeamPress={handleOpenTeam}
          style={[
            styles.leaderboardSection,
            isWideDashboard && styles.leaderboardSectionWide,
          ]}
          titleStyle={isWideDashboard ? styles.leaderboardTitleWide : undefined}
        />
      </View>

      {SHOW_SESSION_DEBUG && (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>Session Debug (Testing)</Text>
          <Text style={styles.sessionLine}>
            isLoggedIn: {String(isLoggedIn)}
          </Text>
          <Text style={styles.sessionLine}>
            authLoading: {String(authLoading)}
          </Text>
          <Text style={styles.sessionLine}>
            isAdminView: {String(isAdminView)}
          </Text>
          <Text style={styles.sessionLine}>userId: {user?.id ?? "null"}</Text>
          <Text style={styles.sessionLine}>
            username: {user?.username ?? "null"}
          </Text>
          <Text style={styles.sessionLine}>
            tokenPresent: {String(Boolean(token))}
          </Text>
          <Text style={styles.sessionLine}>
            selectedGroupId: {selectedGroupId ?? "null"}
          </Text>
          <Text style={styles.sessionLine}>
            groupsLoaded: {String(groupsLoaded)}
          </Text>
          <Text style={styles.sessionLine}>
            userHasGroups: {String(userHasGroups)}
          </Text>
          <Text style={styles.sessionLine}>
            storedTokenPresent: {String(sessionDebug.storedTokenPresent)}
          </Text>
          <Text style={styles.sessionLine}>
            storedUserPresent: {String(sessionDebug.storedUserPresent)}
          </Text>
          <Text style={styles.sessionLine}>
            storedAdminView: {sessionDebug.storedAdminViewValue}
          </Text>
          <Text style={styles.sessionLine}>
            sessionStartedAt: {sessionDebug.storedSessionStartedAt}
          </Text>
          <Text style={styles.sessionLine}>
            sessionAgeSeconds: {sessionDebug.sessionAgeSeconds}
          </Text>
          <Text style={styles.sessionLine}>
            now: {sessionDebug.nowIso || "n/a"}
          </Text>
        </View>
      )}
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
  topWidget: {
    flex: 1,
  },
  topWidgetLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  stackedWidget: {
    marginBottom: Spacing.md,
    width: "100%",
  },
  leaderboardSection: {
    width: "100%",
  },
  leaderboardSectionWide: {
    alignSelf: "stretch",
    flex: 1,
  },
  leaderboardTitleWide: {
    marginTop: 0,
  },
  sessionCard: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sessionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  sessionLine: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    lineHeight: 18,
  },
  rankingBox: {
    minHeight: responsiveMinHeight,
  },
});
