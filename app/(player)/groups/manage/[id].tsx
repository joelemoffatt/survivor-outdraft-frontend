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
import { PickerOption } from '../../../../components/shared/FormPicker';
import FormButton from '../../../../components/shared/FormButton';
import { ConfirmDialog } from '../../../../components/shared/ConfirmDialog';
import apiService, { GroupResponse } from '../../../../services/api';
import { Episode, Season } from '../../../../types/survivor';
import { LocalRule } from '../../../../components/shared/PointRulesInput';
import GroupSettingsForm from '../../../../components/shared/GroupSettingsForm';
import { GroupMember } from '../../../../components/shared/MembersInput';
import useDelayedLoader from '../../../../hooks/useDelayedLoader';

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
  const [resettingDraft, setResettingDraft] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const showLoadingSpinner = useDelayedLoader(loading || loadingSeasons, 200);

  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [initialMembers, setInitialMembers] = useState<GroupMember[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    seasonId: null as number | null,
    latestWatchedEpisodeId: null as number | null,
    firstScoringEpisodeNumber: '1',
    teamSize: '',
    style: 'SNAKE' as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR',
    draftDate: '',
    pointRules: [] as LocalRule[],
    groupMembers: [] as GroupMember[],
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
      const [groupData, seasonsData, membersData] = await Promise.all([
        apiService.getGroupById(groupId),
        apiService.getSeasons(),
        apiService.getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setSeasons(seasonsData);

      const mappedMembers: GroupMember[] = membersData.map((member) => ({
        id: `existing-${member.id}`,
        memberId: member.id,
        username: member.user.username,
        status: member.status,
        isAdmin: member.user.id === groupData.admin.id,
      }));

      setInitialMembers(mappedMembers);

      setFormData({
        name: groupData.name,
        seasonId: groupData.season.id,
        latestWatchedEpisodeId: groupData.latestEpisodeWatched?.id ?? null,
        firstScoringEpisodeNumber: String(groupData.firstScoringEpisodeNumber ?? 1),
        teamSize: String(groupData.teamSize ?? ''),
        style: groupData.draft?.style ?? 'SNAKE',
        draftDate: groupData.draft?.scheduledAt ?? '',
        pointRules: (groupData.pointRules ?? []).map((rule) => ({
          ruleType: rule.ruleType as LocalRule['ruleType'],
          points: rule.points,
        })),
        groupMembers: mappedMembers,
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
      const payload: Parameters<typeof apiService.updateGroupSettings>[1] = {
        name: formData.name.trim(),
        seasonId: Number(formData.seasonId),
        teamSize: parseInt(formData.teamSize, 10),
        latestWatchedEpisodeId: formData.latestWatchedEpisodeId,
        firstScoringEpisodeNumber: parseInt(formData.firstScoringEpisodeNumber, 10),
        style: formData.style,
        pointRules: formData.pointRules.map((rule) => ({
          ruleType: rule.ruleType,
          points: rule.points,
        })),
      };

      const deletedMembers = initialMembers.filter(
        (initialMember) =>
          !initialMember.isAdmin &&
          !formData.groupMembers.some(
            (currentMember) => currentMember.memberId === initialMember.memberId,
          ),
      );

      const addedMembers = formData.groupMembers.filter(
        (member) => !member.memberId,
      );

      const updated = await apiService.updateGroupSettings(groupId, payload);

      for (const member of deletedMembers) {
        if (member.memberId) {
          await apiService.cancelInvitation(member.memberId);
        }
      }

      for (const member of addedMembers) {
        await apiService.inviteByUsername(groupId, member.username);
      }

      const refreshedMembers = await apiService.getGroupMembers(groupId);
      const mappedMembers: GroupMember[] = refreshedMembers.map((member) => ({
        id: `existing-${member.id}`,
        memberId: member.id,
        username: member.user.username,
        status: member.status,
        isAdmin: member.user.id === updated.admin.id,
      }));

      setInitialMembers(mappedMembers);
      setGroup(updated);
      setFormData((prev) => ({
        ...prev,
        pointRules: (updated.pointRules ?? []).map((rule) => ({
          ruleType: rule.ruleType as LocalRule['ruleType'],
          points: rule.points,
        })),
        groupMembers: mappedMembers,
      }));
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

  const confirmResetDraft = async () => {
    try {
      setResetModalVisible(false);
      setResettingDraft(true);
      await apiService.resetDraft(groupId);
      await loadInitialData();
      Alert.alert('Success', 'Draft has been reset.');
    } catch (error) {
      console.error('Failed to reset draft:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to reset draft.'
      );
    } finally {
      setResettingDraft(false);
    }
  };

  if (loading || loadingSeasons) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

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

        <GroupSettingsForm
          formData={formData}
          errors={errors}
          seasonOptions={seasonOptions}
          episodeOptions={episodeOptions}
          draftStyleOptions={draftStyleOptions}
          loadingSeasons={loadingSeasons}
          loadingEpisodes={loadingEpisodes}
          onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          lockedFields={['seasonId']}
          showMembersSection
        />

        <View style={styles.buttonContainer}>
          <FormButton
            title="Save Group Settings"
            onPress={handleSave}
            loading={saving}
            disabled={saving || loadingEpisodes}
          />
          <FormButton
            title="Reset Draft"
            onPress={() => setResetModalVisible(true)}
            loading={resettingDraft}
            disabled={saving || loadingEpisodes || resettingDraft}
            variant="danger"
            style={styles.resetButton}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={resetModalVisible}
        title="Reset Draft"
        message="Are you sure you want to reset the draft? This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        confirmVariant="danger"
        onCancel={() => setResetModalVisible(false)}
        onConfirm={confirmResetDraft}
      />
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
    gap: Spacing.md,
  },
  resetButton: {
    marginTop: Spacing.sm,
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
