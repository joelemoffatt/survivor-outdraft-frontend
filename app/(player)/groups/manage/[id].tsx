import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing } from '../../../../constants/theme';
import FormInput from '../../../../components/shared/FormInput';
import FormPicker, { PickerOption } from '../../../../components/shared/FormPicker';
import FormButton from '../../../../components/shared/FormButton';
import apiService, { GroupResponse } from '../../../../services/api';
import { Episode, Season } from '../../../../types/survivor';

const draftStyleOptions: PickerOption[] = [
  { label: 'Snake', value: 'SNAKE' },
  { label: 'Round Robin', value: 'ROUND_ROBIN' },
  { label: 'Linear', value: 'LINEAR' },
];

export default function ManageGroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    seasonId: null as number | null,
    latestWatchedEpisodeId: null as number | null,
    firstScoringEpisodeNumber: '1',
    teamSize: '',
    style: 'SNAKE' as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR',
  });

  const [errors, setErrors] = useState({
    name: '',
    seasonId: '',
    latestWatchedEpisodeId: '',
    firstScoringEpisodeNumber: '',
    teamSize: '',
  });

  useEffect(() => {
    loadInitialData();
  }, [groupId]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!formData.seasonId) {
        setEpisodes([]);
        return;
      }
      try {
        setLoadingEpisodes(true);
        const episodeData = await apiService.getEpisodes(formData.seasonId);
        setEpisodes(episodeData);
      } catch (error) {
        console.error('Failed to load episodes:', error);
        Alert.alert('Error', 'Failed to load episodes for selected season.');
      } finally {
        setLoadingEpisodes(false);
      }
    };

    loadEpisodes();
  }, [formData.seasonId]);

  const loadInitialData = async () => {
    if (!Number.isFinite(groupId) || groupId <= 0) {
      Alert.alert('Error', 'Invalid group id');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const [groupData, seasonsData] = await Promise.all([
        apiService.getGroupById(groupId),
        apiService.getSeasons(),
      ]);
      setGroup(groupData);
      setSeasons(seasonsData);
      setFormData({
        name: groupData.name,
        seasonId: groupData.season.id,
        latestWatchedEpisodeId: groupData.latestEpisodeWatched?.id ?? null,
        firstScoringEpisodeNumber: String(groupData.firstScoringEpisodeNumber ?? 1),
        teamSize: String(groupData.teamSize ?? ''),
        style: groupData.draft?.style ?? 'SNAKE',
      });
    } catch (error) {
      console.error('Failed to load group settings:', error);
      Alert.alert('Error', 'Failed to load group settings.');
      router.back();
    } finally {
      setLoading(false);
      setLoadingSeasons(false);
    }
  };

  const watchedEpisode = useMemo(
    () => episodes.find((episode) => episode.id === formData.latestWatchedEpisodeId),
    [episodes, formData.latestWatchedEpisodeId]
  );

  const seasonOptions: PickerOption[] = seasons.map((season) => ({
    label: season.seasonName || `Survivor ${season.season}`,
    value: season.season,
  }));

  const episodeOptions: PickerOption[] = [
    { label: "Haven't watched any episodes", value: null },
    ...episodes.map((episode) => ({
      label: `Episode ${episode.episodeNumber}${episode.episodeTitle ? ` - ${episode.episodeTitle}` : ''}`,
      value: episode.id,
    })),
  ];

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      seasonId: '',
      latestWatchedEpisodeId: '',
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
      newErrors.seasonId = 'Season is required';
      isValid = false;
    }

    const teamSize = parseInt(formData.teamSize, 10);
    if (!formData.teamSize.trim()) {
      newErrors.teamSize = 'Team size is required';
      isValid = false;
    } else if (isNaN(teamSize) || teamSize < 1) {
      newErrors.teamSize = 'Team size must be a positive number';
      isValid = false;
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const updated = await apiService.updateGroupSettings(groupId, {
        name: formData.name.trim(),
        seasonId: Number(formData.seasonId),
        teamSize: parseInt(formData.teamSize, 10),
        latestWatchedEpisodeId: formData.latestWatchedEpisodeId,
        firstScoringEpisodeNumber: parseInt(formData.firstScoringEpisodeNumber, 10),
        style: formData.style,
      });
      setGroup(updated);
      Alert.alert('Success', 'Group settings updated. Scores were recalculated.');
    } catch (error) {
      console.error('Failed to update group settings:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update group settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingSeasons) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading group settings...</Text>
      </View>
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
          Update your group settings. Changes to scoring episodes recalculate points immediately.
        </Text>

        <FormInput
          label="Group Name"
          value={formData.name}
          onChangeText={(name) => setFormData((prev) => ({ ...prev, name }))}
          placeholder="Enter group name"
          error={errors.name}
          required
          maxLength={100}
        />

        <FormPicker
          label="Season"
          value={formData.seasonId}
          options={seasonOptions}
          onValueChange={(seasonId) =>
            setFormData((prev) => ({
              ...prev,
              seasonId: seasonId == null ? null : Number(seasonId),
              latestWatchedEpisodeId: null,
            }))
          }
          placeholder="Select a season"
          error={errors.seasonId}
          required
          searchable
        />

        <FormPicker
          label="Latest Episode Watched (optional)"
          value={formData.latestWatchedEpisodeId}
          options={episodeOptions}
          onValueChange={(latestWatchedEpisodeId) =>
            setFormData((prev) => ({
              ...prev,
              latestWatchedEpisodeId:
                latestWatchedEpisodeId == null ? null : Number(latestWatchedEpisodeId),
            }))
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
            setFormData((prev) => ({ ...prev, firstScoringEpisodeNumber }))
          }
          placeholder="e.g., 1"
          error={errors.firstScoringEpisodeNumber}
          keyboardType="number-pad"
          required
        />

        <FormInput
          label="Team Size"
          value={formData.teamSize}
          onChangeText={(teamSize) => setFormData((prev) => ({ ...prev, teamSize }))}
          placeholder="e.g., 10"
          error={errors.teamSize}
          keyboardType="number-pad"
          required
        />

        <FormPicker
          label="Draft Style"
          value={formData.style}
          options={draftStyleOptions}
          onValueChange={(style) =>
            setFormData((prev) => ({
              ...prev,
              style: (style ?? 'SNAKE') as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR',
            }))
          }
          placeholder="Select draft style"
          required
        />

        <View style={styles.buttonContainer}>
          <FormButton
            title="Save Group Settings"
            onPress={handleSave}
            loading={saving}
            disabled={saving || loadingEpisodes}
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
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
});
