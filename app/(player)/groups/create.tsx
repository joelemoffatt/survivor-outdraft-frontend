import { useEffect, useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { GroupResponse } from '../../../services/api';
import { Episode, Season } from '../../../types/survivor';
import FormInput from '../../../components/shared/FormInput';
import FormPicker, { PickerOption } from '../../../components/shared/FormPicker';
import FormButton from '../../../components/shared/FormButton';
import InviteMember from '../../../components/shared/InviteMember';

const draftStyleOptions: PickerOption[] = [
  { label: 'Snake', value: 'SNAKE' },
  { label: 'Round Robin', value: 'ROUND_ROBIN' },
  { label: 'Linear', value: 'LINEAR' },
];

const DEADLOCK_PREVIEW_PARTICIPANTS = 4;

const calculatePosition = (
  pickNumber: number,
  numPlayers: number,
  style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR'
): number => {
  switch (style) {
    case 'SNAKE': {
      const round = Math.floor((pickNumber - 1) / numPlayers);
      if (round % 2 === 0) {
        return (pickNumber - 1) % numPlayers;
      }
      return numPlayers - 1 - ((pickNumber - 1) % numPlayers);
    }
    case 'ROUND_ROBIN':
    case 'LINEAR':
    default:
      return (pickNumber - 1) % numPlayers;
  }
};

const isDeadlockSafe = (
  totalParticipants: number,
  teamSize: number,
  totalCastaways: number,
  style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR'
): boolean => {
  if (totalParticipants <= 0 || teamSize <= 0 || totalCastaways <= 0) {
    return false;
  }

  if (totalCastaways < teamSize) {
    return false;
  }

  const totalPicks = totalParticipants * teamSize;
  const picksMadeByPosition = new Array(totalParticipants).fill(0);
  const picksMadeByPositionThisCycle = new Array(totalParticipants).fill(0);

  for (let pickNumber = 1; pickNumber <= totalPicks; pickNumber++) {
    const position = calculatePosition(pickNumber, totalParticipants, style);
    const picksBeforeThisTurnInCycle = (pickNumber - 1) % totalCastaways;
    const otherPlayersPicksThisCycle =
      picksBeforeThisTurnInCycle - picksMadeByPositionThisCycle[position];
    const guaranteedOptionsRemaining =
      totalCastaways - picksMadeByPosition[position] - otherPlayersPicksThisCycle;

    if (guaranteedOptionsRemaining <= 0) {
      return false;
    }

    picksMadeByPosition[position] += 1;
    picksMadeByPositionThisCycle[position] += 1;

    if (pickNumber % totalCastaways === 0) {
      picksMadeByPositionThisCycle.fill(0);
    }
  }

  return true;
};

const findMinimumSafeCastaways = (
  totalParticipants: number,
  teamSize: number,
  style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR'
): number => {
  const totalPicks = totalParticipants * teamSize;
  let candidate = Math.max(teamSize, 1);

  while (candidate <= totalPicks && !isDeadlockSafe(totalParticipants, teamSize, candidate, style)) {
    candidate += 1;
  }

  return candidate;
};

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedGroupId } = useGroup();

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<GroupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasonCastawayCount, setSeasonCastawayCount] = useState<number | null>(null);
  const [loadingCastawayStats, setLoadingCastawayStats] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    seasonId: null as number | null,
    latestWatchedEpisodeId: null as number | null,
    firstScoringEpisodeNumber: '1',
    teamSize: '',
    style: 'SNAKE' as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR',
    draftDate: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    seasonId: '',
    firstScoringEpisodeNumber: '',
    teamSize: '',
  });

  useEffect(() => {
    loadSeasons();
  }, []);

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
        console.error('Failed to load episodes:', error);
        // TODO: replace alerts with custom popup
        Alert.alert('Error', 'Failed to load episodes. Please try again.');
        setEpisodes([]);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    setFormData((prev) => ({ ...prev, latestWatchedEpisodeId: null, firstScoringEpisodeNumber: '1' }));
    loadEpisodes();
  }, [formData.seasonId]);

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
        console.error('Failed to load season castaways:', error);
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
      console.error('Failed to load seasons:', error);
      Alert.alert('Error', 'Failed to load seasons. Please try again.');
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
      label: `Episode ${episode.episodeNumber}${episode.episodeTitle ? ` - ${episode.episodeTitle}` : ''}`,
      value: episode.id,
    })),
  ];

  const parsedTeamSize = parseInt(formData.teamSize, 10);
  const hasValidTeamSize = !isNaN(parsedTeamSize) && parsedTeamSize > 0;
  const watchedEpisode = episodes.find((episode) => episode.id === formData.latestWatchedEpisodeId);
  const assumedEliminations = watchedEpisode?.episodeNumber ?? 0;
  const availableCastaways =
    seasonCastawayCount == null
      ? null
      : Math.max(seasonCastawayCount - assumedEliminations, 0);
  const minimumSafeCastaways = hasValidTeamSize
    ? findMinimumSafeCastaways(DEADLOCK_PREVIEW_PARTICIPANTS, parsedTeamSize, formData.style)
    : null;
  const isDeadlockSafePreview =
    hasValidTeamSize &&
    availableCastaways != null &&
    isDeadlockSafe(DEADLOCK_PREVIEW_PARTICIPANTS, parsedTeamSize, availableCastaways, formData.style);

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      seasonId: '',
      firstScoringEpisodeNumber: '',
      teamSize: '',
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
      isValid = false;
    } else if (formData.name.length > 100) {
      newErrors.name = 'Group name must be less than 100 characters';
      isValid = false;
    }

    if (!formData.seasonId) {
      newErrors.seasonId = 'Please select a season';
      isValid = false;
    }

    if (!formData.teamSize.trim()) {
      newErrors.teamSize = 'Team size is required';
      isValid = false;
    } else {
      const teamSizeNum = parseInt(formData.teamSize, 10);
      if (isNaN(teamSizeNum) || teamSizeNum < 1) {
        newErrors.teamSize = 'Team size must be a positive number';
        isValid = false;
      }
    }

    const firstScoringEpisodeNumber = parseInt(formData.firstScoringEpisodeNumber, 10);
    if (!formData.firstScoringEpisodeNumber.trim()) {
      newErrors.firstScoringEpisodeNumber = 'First scoring episode is required';
      isValid = false;
    } else if (isNaN(firstScoringEpisodeNumber) || firstScoringEpisodeNumber < 1) {
      newErrors.firstScoringEpisodeNumber = 'First scoring episode must be 1 or greater';
      isValid = false;
    } else if (watchedEpisode && firstScoringEpisodeNumber > watchedEpisode.episodeNumber) {
      newErrors.firstScoringEpisodeNumber = 'Cannot be greater than latest watched episode number';
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
        firstScoringEpisodeNumber: parseInt(formData.firstScoringEpisodeNumber, 10),
        teamSize: parseInt(formData.teamSize, 10),
        style: formData.style,
      };

      if (formData.draftDate) {
        groupData.scheduledAt = formData.draftDate;
      }

      const newGroup = await apiService.createGroup(groupData);
      
      // Set the newly created group as selected
      setSelectedGroupId(newGroup.id);
      setCreatedGroup(newGroup);
      
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create group. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess && createdGroup) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
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
          <InviteMember
            groupId={createdGroup.id}
            groupName={createdGroup.name}
          />
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.description}>
          Create a new group to compete with friends! As the group admin, you'll be able to
          invite members and manage draft settings.
        </Text>

        <FormInput
          label="Group Name"
          value={formData.name}
          onChangeText={(name) => setFormData({ ...formData, name })}
          placeholder="Enter group name"
          error={errors.name}
          required
          maxLength={100}
        />

        <FormPicker
          label="Season"
          value={formData.seasonId}
          options={seasonOptions}
          onValueChange={(seasonId) => setFormData({ ...formData, seasonId: seasonId as number })}
          placeholder={loadingSeasons ? 'Loading seasons...' : 'Select a season'}
          error={errors.seasonId}
          required
          searchable
        />

        <FormPicker
          label="Latest Episode Watched (optional)"
          value={formData.latestWatchedEpisodeId}
          options={episodeOptions}
          onValueChange={(latestWatchedEpisodeId) =>
            setFormData({
              ...formData,
              latestWatchedEpisodeId:
                latestWatchedEpisodeId == null ? null : Number(latestWatchedEpisodeId),
            })
          }
          placeholder={
            !formData.seasonId
              ? 'Select a season first'
              : loadingEpisodes
                ? 'Loading episodes...'
                : 'None (all castaways visible)'
          }
          searchable
        />

        <FormInput
          label="First Scoring Episode Number"
          value={formData.firstScoringEpisodeNumber}
          onChangeText={(firstScoringEpisodeNumber) =>
            setFormData({ ...formData, firstScoringEpisodeNumber })
          }
          placeholder="e.g., 1"
          error={errors.firstScoringEpisodeNumber}
          keyboardType="number-pad"
          required
        />

        <FormInput
          label="Team Size"
          value={formData.teamSize}
          onChangeText={(teamSize) => setFormData({ ...formData, teamSize })}
          placeholder="e.g., 10"
          error={errors.teamSize}
          keyboardType="number-pad"
          required
        />

        {formData.seasonId && (
          <View style={styles.deadlockInfoCard}>
            <Text style={styles.deadlockInfoTitle}>Deadlock safety preview</Text>
            <Text style={styles.deadlockInfoText}>
              Uses a 4-player worst case (you + 3 others) and assumes at least 1 castaway leaves each watched episode.
            </Text>
            {loadingCastawayStats ? (
              <Text style={styles.deadlockInfoText}>Calculating available castaways...</Text>
            ) : (
              <>
                <Text style={styles.deadlockInfoText}>
                  Available castaways: {availableCastaways ?? 'Unknown'}
                </Text>
                <Text style={styles.deadlockInfoText}>
                  Assumed eliminated from watched episodes: {assumedEliminations}
                </Text>
                {minimumSafeCastaways != null && (
                  <Text style={styles.deadlockInfoText}>
                    Minimum needed for team size {parsedTeamSize}: {minimumSafeCastaways}
                  </Text>
                )}
                {minimumSafeCastaways != null && availableCastaways != null && (
                  <Text
                    style={[
                      styles.deadlockInfoResult,
                      isDeadlockSafePreview ? styles.deadlockSafe : styles.deadlockRisk,
                    ]}
                  >
                    {isDeadlockSafePreview
                      ? 'Looks safe for 4 players.'
                      : 'Risk: not enough castaways for 4-player worst case.'}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        <FormPicker
          label="Draft Style"
          value={formData.style}
          options={draftStyleOptions}
          onValueChange={(style) => setFormData({ ...formData, style: style as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR' })}
          placeholder="Select draft style"
          required
        />

        <FormInput
          label="Scheduled Start (optional)"
          value={formData.draftDate}
          onChangeText={(draftDate) => setFormData({ ...formData, draftDate })}
          placeholder="YYYY-MM-DDTHH:mm:ss"
        />

        <View style={styles.buttonContainer}>
          <FormButton
            title="Create Group"
            onPress={handleSubmit}
            loading={loading}
            disabled={loadingSeasons || loadingEpisodes}
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
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  deadlockInfoText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  deadlockInfoResult: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.small,
    fontWeight: '600',
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inviteSection: {
    marginBottom: Spacing.xl,
  },
  successActions: {
    gap: Spacing.sm,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: FontSizes.large,
    fontWeight: '600',
  },
});
