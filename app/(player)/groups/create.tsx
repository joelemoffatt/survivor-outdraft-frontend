import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSizes, Spacing } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useGroup } from "../../../contexts/GroupContext";
import apiService, { GroupResponse } from "../../../services/api";
import { Episode, Season } from "../../../types/survivor";
import { PickerOption } from "../../../components/shared/FormPicker";
import FormButton from "../../../components/shared/FormButton";
import { LocalRule } from "../../../components/shared/PointRulesInput";
import MembersInput, {
  GroupMember,
  MembershipStatus,
} from "../../../components/shared/MembersInput";
import GroupSettingsForm from "../../../components/shared/GroupSettingsForm";

const defaultRulesConfig = require("../../../constants/defaultGroupRules.json") as {
  rules?: Array<{ ruleType?: string; points?: number }>;
};

const draftStyleOptions: PickerOption[] = [
  { label: "Snake", value: "SNAKE" },
  { label: "Round Robin", value: "ROUND_ROBIN" },
  { label: "Linear", value: "LINEAR" },
];

const VALID_RULE_TYPES: LocalRule["ruleType"][] = [
  "INDIVIDUAL_IMMUNITY",
  "TRIBAL_IMMUNITY",
  "FOUND_IDOL",
  "FOUND_ADVANTAGE",
  "SOLE_SURVIVOR",
  "RUNNER_UP",
  "MADE_MERGE",
  "MED_EVAC",
  "QUIT",
];

const getInitialDefaultRules = (): LocalRule[] => {
  const rules = defaultRulesConfig?.rules ?? [];
  return rules
    .filter(
      (rule): rule is { ruleType: LocalRule["ruleType"]; points: number } =>
        !!rule &&
        typeof rule.ruleType === "string" &&
        VALID_RULE_TYPES.includes(rule.ruleType as LocalRule["ruleType"]) &&
        typeof rule.points === "number",
    )
    .map((rule) => ({
      ruleType: rule.ruleType,
      points: rule.points,
    }));
};

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedGroupId } = useGroup();

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<GroupResponse | null>(null);
  const [successMembers, setSuccessMembers] = useState<GroupMember[]>([]);
  const [loadingSuccessMembers, setLoadingSuccessMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasonCastawayCount, setSeasonCastawayCount] = useState<number | null>(
    null,
  );
  const [loadingCastawayStats, setLoadingCastawayStats] = useState(false);
  const [bootsCount, setBootsCount] = useState<number>(0);

  const [formData, setFormData] = useState({
    name: "",
    seasonId: null as number | null,
    latestWatchedEpisodeId: null as number | null,
    firstScoringEpisodeNumber: "1",
    teamSize: "",
    style: "SNAKE" as "SNAKE" | "ROUND_ROBIN" | "LINEAR",
    draftDate: "",
    pointRules: getInitialDefaultRules(),
  });

  const [errors, setErrors] = useState({
    name: "",
    seasonId: "",
    firstScoringEpisodeNumber: "",
    teamSize: "",
  });

  const getTeamSizeAvailabilityError = (
    teamSizeValue: string,
    available: number | null,
  ): string => {
    if (!teamSizeValue.trim()) {
      return "";
    }

    const teamSizeNum = parseInt(teamSizeValue, 10);
    if (isNaN(teamSizeNum) || teamSizeNum < 1) {
      return "Team size must be a positive number";
    }

    if (available != null && teamSizeNum > available) {
      return `Team size cannot exceed available castaways (${available})`;
    }

    return "";
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    const loadGroupMembers = async () => {
      if (!showSuccess || !createdGroup) {
        return;
      }

      try {
        setLoadingSuccessMembers(true);
        const members = await apiService.getGroupMembers(createdGroup.id);
        const mappedMembers: GroupMember[] = members.map((member) => ({
          id: String(member.id),
          memberId: member.id,
          username: member.user.username,
          status: member.status as MembershipStatus,
          isAdmin: member.user.id === createdGroup.admin.id,
        }));
        setSuccessMembers(mappedMembers);
      } catch (error) {
        console.error("Failed to load group members:", error);
      } finally {
        setLoadingSuccessMembers(false);
      }
    };

    loadGroupMembers();
  }, [showSuccess, createdGroup]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!formData.seasonId) {
        setEpisodes([]);
        return;
      }

      try {
        setLoadingEpisodes(true);
        const episodesData = await apiService.getEpisodes(formData.seasonId);
        setEpisodes(episodesData);
      } catch (error) {
        console.error("Failed to load episodes:", error);
        // TODO: replace alerts with custom popup
        Alert.alert("Error", "Failed to load episodes. Please try again.");
        setEpisodes([]);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    setFormData((prev) => ({
      ...prev,
      latestWatchedEpisodeId: null,
      firstScoringEpisodeNumber: "1",
    }));
    loadEpisodes();
  }, [formData.seasonId]);

  useEffect(() => {
    const countBootsUpToEpisode = async () => {
      if (!formData.seasonId || !formData.latestWatchedEpisodeId) {
        setBootsCount(0);
        return;
      }

      try {
        setLoadingCastawayStats(true);
        const watchedEpisodeData = episodes.find(
          (episode) => episode.id === formData.latestWatchedEpisodeId,
        );

        if (!watchedEpisodeData) {
          setBootsCount(0);
          return;
        }

        // Count boots from all episodes up to and including this one
        let totalBoots = 0;
        for (const episode of episodes) {
          if (episode.episodeNumber <= watchedEpisodeData.episodeNumber) {
            try {
              const detail = await apiService.getEpisodeDetail(
                formData.seasonId,
                episode.episodeNumber,
              );
              totalBoots += detail.boots?.length ?? 0;
              totalBoots += detail.tribals?.length ?? 0;
            } catch (error) {
              console.error(
                `Failed to load episode ${episode.episodeNumber} details:`,
                error,
              );
            }
          }
        }

        setBootsCount(totalBoots);
      } catch (error) {
        console.error("Failed to count boots:", error);
        setBootsCount(0);
      } finally {
        setLoadingCastawayStats(false);
      }
    };

    countBootsUpToEpisode();
  }, [formData.seasonId, formData.latestWatchedEpisodeId, episodes]);

  useEffect(() => {
    const loadSeasonCastaways = async () => {
      if (!formData.seasonId) {
        setSeasonCastawayCount(null);
        return;
      }

      try {
        setLoadingCastawayStats(true);
        const castaways = await apiService.getCastaways(formData.seasonId);
        setSeasonCastawayCount(castaways.length);
      } catch (error) {
        console.error("Failed to load season castaways:", error);
        setSeasonCastawayCount(null);
      } finally {
        setLoadingCastawayStats(false);
      }
    };

    loadSeasonCastaways();
  }, [formData.seasonId]);

  const loadSeasons = async () => {
    try {
      setLoadingSeasons(true);
      const seasonsData = await apiService.getSeasons();
      setSeasons(seasonsData);
    } catch (error) {
      console.error("Failed to load seasons:", error);
      Alert.alert("Error", "Failed to load seasons. Please try again.");
    } finally {
      setLoadingSeasons(false);
    }
  };

  const seasonOptions: PickerOption[] = seasons.map((season) => ({
    label: season.seasonName || `Survivor ${season.season}`,
    value: season.season,
  }));

  const episodeOptions: PickerOption[] = [
    {
      label: "Haven't watched any episodes",
      value: null,
    },
    ...episodes.map((episode) => ({
      label: `Episode ${episode.episodeNumber}${episode.episodeTitle ? ` - ${episode.episodeTitle}` : ""}`,
      value: episode.id,
    })),
  ];

  const watchedEpisode = episodes.find(
    (episode) => episode.id === formData.latestWatchedEpisodeId,
  );
  const availableCastaways =
    seasonCastawayCount == null
      ? null
      : Math.max(seasonCastawayCount - bootsCount, 0);
  const teamSizeAvailabilityError = getTeamSizeAvailabilityError(
    formData.teamSize,
    availableCastaways,
  );
  const isTeamSizeAvailable = teamSizeAvailabilityError.length === 0;

  useEffect(() => {
    if (!formData.teamSize.trim()) {
      return;
    }

    const nextTeamSizeError = getTeamSizeAvailabilityError(
      formData.teamSize,
      availableCastaways,
    );
    if (nextTeamSizeError !== errors.teamSize) {
      setErrors((prev) => ({ ...prev, teamSize: nextTeamSizeError }));
    }
  }, [formData.teamSize, availableCastaways, errors.teamSize]);

  const validateForm = (): boolean => {
    const newErrors = {
      name: "",
      seasonId: "",
      firstScoringEpisodeNumber: "",
      teamSize: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
      isValid = false;
    } else if (formData.name.length > 100) {
      newErrors.name = "Group name must be less than 100 characters";
      isValid = false;
    }

    if (!formData.seasonId) {
      newErrors.seasonId = "Please select a season";
      isValid = false;
    }

    if (!formData.teamSize.trim()) {
      newErrors.teamSize = "Team size is required";
      isValid = false;
    } else {
      const teamSizeNum = parseInt(formData.teamSize, 10);
      if (isNaN(teamSizeNum) || teamSizeNum < 1) {
        newErrors.teamSize = "Team size must be a positive number";
        isValid = false;
      } else if (
        availableCastaways != null &&
        teamSizeNum > availableCastaways
      ) {
        newErrors.teamSize = `Team size cannot exceed available castaways (${availableCastaways})`;
        isValid = false;
      }
    }

    const firstScoringEpisodeNumber = parseInt(
      formData.firstScoringEpisodeNumber,
      10,
    );
    if (!formData.firstScoringEpisodeNumber.trim()) {
      newErrors.firstScoringEpisodeNumber = "First scoring episode is required";
      isValid = false;
    } else if (
      isNaN(firstScoringEpisodeNumber) ||
      firstScoringEpisodeNumber < 1
    ) {
      newErrors.firstScoringEpisodeNumber =
        "First scoring episode must be 1 or greater";
      isValid = false;
    } else if (
      watchedEpisode &&
      firstScoringEpisodeNumber > watchedEpisode.episodeNumber
    ) {
      newErrors.firstScoringEpisodeNumber =
        "Cannot be greater than latest watched episode number";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) {
      return;
    }

    try {
      setLoading(true);

      const groupData: any = {
        name: formData.name.trim(),
        admin: { id: user.id },
        season: { id: formData.seasonId },
        ...(formData.latestWatchedEpisodeId != null && {
          latestWatchedEpisode: { id: formData.latestWatchedEpisodeId },
        }),
        firstScoringEpisodeNumber: parseInt(
          formData.firstScoringEpisodeNumber,
          10,
        ),
        draft: {
          teamSize: parseInt(formData.teamSize, 10),
          style: formData.style,
        },
        pointRules: formData.pointRules.map((rule) => ({
          ruleType: rule.ruleType,
          points: rule.points,
        })),
      };

      if (formData.draftDate) {
        groupData.draft.scheduledAt = formData.draftDate;
      }

      const newGroup = await apiService.createGroup(groupData);

      // Set the newly created group as selected
      setSelectedGroupId(newGroup.id);
      setCreatedGroup(newGroup);

      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create group. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessMembersChange = async (nextMembers: GroupMember[]) => {
    if (!createdGroup) {
      return;
    }

    if (nextMembers.length < successMembers.length) {
      const removedMembers = successMembers.filter(
        (member) => !nextMembers.some((nextMember) => nextMember.id === member.id),
      );

      setSuccessMembers(nextMembers);

      for (const member of removedMembers) {
        if (!member.memberId || member.isAdmin) {
          continue;
        }

        try {
          await apiService.cancelInvitation(member.memberId);
        } catch (error) {
          console.error("Failed to cancel invitation:", error);
          Alert.alert(
            "Error",
            error instanceof Error
              ? error.message
              : `Failed to remove ${member.username}.`,
          );
        }
      }
      return;
    }

    const addedMembers = nextMembers.filter(
      (member) => !successMembers.some((existingMember) => existingMember.id === member.id),
    );

    if (addedMembers.length === 0) {
      setSuccessMembers(nextMembers);
      return;
    }

    setSuccessMembers(
      nextMembers.map((member) =>
        addedMembers.some((addedMember) => addedMember.id === member.id)
          ? { ...member, status: "PENDING" }
          : member,
      ),
    );

    for (const addedMember of addedMembers) {
      try {
        const createdMember = await apiService.inviteByUsername(
          createdGroup.id,
          addedMember.username,
        );

        setSuccessMembers((prev) =>
          prev.map((member) =>
            member.id === addedMember.id
              ? {
                  id: String(createdMember.id),
                  memberId: createdMember.id,
                  username: createdMember.user.username,
                  status: createdMember.status as MembershipStatus,
                  isAdmin: createdMember.user.id === createdGroup.admin.id,
                }
              : member,
          ),
        );
      } catch (error) {
        console.error("Failed to send invitation:", error);
        setSuccessMembers((prev) => prev.filter((member) => member.id !== addedMember.id));
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : `Failed to invite ${addedMember.username}.`,
        );
      }
    }
  };

  if (showSuccess && createdGroup) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.successContent}
      >
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Group Created!</Text>
          <Text style={styles.successSubtitle}>
            You are now the admin of {createdGroup.name}
          </Text>
        </View>

        <View style={styles.inviteSection}>
          <Text style={styles.inviteTitle}>Invite Members</Text>
          {loadingSuccessMembers ? (
            <Text style={styles.loadingMembersText}>Loading members...</Text>
          ) : (
            <MembersInput
              style={{ marginTop: 0 }}
              members={successMembers}
              onChange={handleSuccessMembersChange}
            />
          )}
        </View>

        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.description}>
          Create a new group to compete with friends! As the group admin, you'll
          be able to invite members and manage draft settings.
        </Text>

        <GroupSettingsForm
          formData={formData}
          errors={errors}
          seasonOptions={seasonOptions}
          episodeOptions={episodeOptions}
          draftStyleOptions={draftStyleOptions}
          loadingSeasons={loadingSeasons}
          loadingEpisodes={loadingEpisodes}
          onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          showDraftDate
          showSafetyInfo
          seasonCastawayCount={seasonCastawayCount}
          bootsCount={bootsCount}
          availableCastaways={availableCastaways}
          teamSizeAvailabilityError={teamSizeAvailabilityError}
          loadingCastawayStats={loadingCastawayStats}
        />

        <View style={styles.buttonContainer}>
          <FormButton
            title="Create Group"
            onPress={handleSubmit}
            loading={loading}
            disabled={loadingSeasons || loadingEpisodes || !isTeamSizeAvailable}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  deadlockInfoCard: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.infoBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deadlockInfoTitle: {
    fontSize: FontSizes.medium,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  deadlockInfoText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  teamSizeErrorText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.small,
    fontWeight: "600",
    color: Colors.warning,
  },
  deadlockInfoResult: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.small,
    fontWeight: "600",
  },
  deadlockSafe: {
    color: Colors.success,
  },
  deadlockRisk: {
    color: Colors.warning,
  },
  successContent: {
    padding: Spacing.lg,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: FontSizes.xxlarge,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  inviteSection: {
    marginBottom: Spacing.xl,
  },
  inviteTitle: {
    fontSize: FontSizes.large,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inviteSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  loadingMembersText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  successActions: {
    gap: Spacing.sm,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: FontSizes.large,
    fontWeight: "600",
  },
});
