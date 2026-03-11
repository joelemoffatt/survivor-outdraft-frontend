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

  const [formData, setFormData] = useState({
    name: '',
    seasonId: null as number | null,
    latestWatchedEpisodeId: null as number | null,
    teamSize: '',
    style: 'SNAKE' as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR',
    draftDate: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    seasonId: '',
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
        Alert.alert('Error', 'Failed to load episodes. Please try again.');
        setEpisodes([]);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    setFormData((prev) => ({ ...prev, latestWatchedEpisodeId: null }));
    loadEpisodes();
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

  const episodeOptions: PickerOption[] = episodes.map((episode) => ({
    label: `Episode ${episode.episodeNumber}${episode.episodeTitle ? ` - ${episode.episodeTitle}` : ''}`,
    value: episode.id,
  }));

  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      seasonId: '',
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
            setFormData({ ...formData, latestWatchedEpisodeId: latestWatchedEpisodeId as number })
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
          label="Team Size"
          value={formData.teamSize}
          onChangeText={(teamSize) => setFormData({ ...formData, teamSize })}
          placeholder="e.g., 10"
          error={errors.teamSize}
          keyboardType="number-pad"
          required
        />

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
