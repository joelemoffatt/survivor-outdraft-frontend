import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import FormInput from './FormInput';
import FormPicker, { PickerOption } from './FormPicker';
import PointRulesInput, { LocalRule } from './PointRulesInput';
import MembersInput, { GroupMember } from './MembersInput';

export type DraftStyle = 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';

export interface GroupSettingsFormData {
  name: string;
  seasonId: number | null;
  latestWatchedEpisodeId: number | null;
  firstScoringEpisodeNumber: string;
  teamSize: string;
  style: DraftStyle;
  draftDate?: string;
  pointRules: LocalRule[];
  groupMembers?: GroupMember[];
}

export interface GroupSettingsFormErrors {
  name?: string;
  seasonId?: string;
  firstScoringEpisodeNumber?: string;
  teamSize?: string;
}

type LockedField =
  | 'name'
  | 'seasonId'
  | 'latestWatchedEpisodeId'
  | 'teamSize'
  | 'style'
  | 'firstScoringEpisodeNumber'
  | 'draftDate';

export interface GroupSettingsFormProps {
  formData: GroupSettingsFormData;
  errors: GroupSettingsFormErrors;
  seasonOptions: PickerOption[];
  episodeOptions: PickerOption[];
  draftStyleOptions: PickerOption[];
  loadingSeasons: boolean;
  loadingEpisodes: boolean;
  onFormChange: (patch: Partial<GroupSettingsFormData>) => void;
  lockedFields?: LockedField[];
  showMembersSection?: boolean;
  showDraftDate?: boolean;
  showSafetyInfo?: boolean;
  seasonCastawayCount?: number | null;
  bootsCount?: number;
  availableCastaways?: number | null;
  teamSizeAvailabilityError?: string;
  loadingCastawayStats?: boolean;
}

export default function GroupSettingsForm({
  formData,
  errors,
  seasonOptions,
  episodeOptions,
  draftStyleOptions,
  loadingSeasons,
  loadingEpisodes,
  onFormChange,
  lockedFields = [],
  showMembersSection = false,
  showDraftDate = false,
  showSafetyInfo = false,
  seasonCastawayCount = null,
  bootsCount = 0,
  availableCastaways = null,
  teamSizeAvailabilityError = '',
  loadingCastawayStats = false,
}: GroupSettingsFormProps) {
  const isLocked = (field: LockedField) =>
    lockedFields.includes(field);

  return (
    <>
      <FormInput
        label="Group Name"
        value={formData.name}
        onChangeText={(name) => onFormChange({ name })}
        placeholder="Enter group name"
        error={errors.name}
        required
        maxLength={100}
        editable={!isLocked('name')}
      />

      <FormPicker
        label="Season"
        value={formData.seasonId}
        options={seasonOptions}
        onValueChange={(seasonId) =>
          onFormChange({
            seasonId: seasonId == null ? null : Number(seasonId),
            latestWatchedEpisodeId: null,
            firstScoringEpisodeNumber: '1',
          })
        }
        placeholder={loadingSeasons ? 'Loading seasons...' : 'Select a season'}
        error={errors.seasonId}
        required
        searchable
        disabled={isLocked('seasonId')}
      />

      <FormPicker
        label="Latest Episode Watched"
        value={formData.latestWatchedEpisodeId}
        options={episodeOptions}
        onValueChange={(latestWatchedEpisodeId) =>
          onFormChange({
            latestWatchedEpisodeId:
              latestWatchedEpisodeId == null ? null : Number(latestWatchedEpisodeId),
          })
        }
        placeholder={
          !formData.seasonId
            ? 'Choose season first'
            : loadingEpisodes
            ? 'Loading episodes...'
            : 'None (all castaways visible)'
        }
        searchable
        disabled={!formData.seasonId || isLocked('latestWatchedEpisodeId')}
        required
      />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Draft</Text>

        <FormInput
          label="Team Size"
          value={formData.teamSize}
          onChangeText={(teamSize) => onFormChange({ teamSize })}
          placeholder="e.g., 10"
          error={errors.teamSize}
          keyboardType="number-pad"
          required
          editable={!!formData.seasonId && !isLocked('teamSize')}
        />

        <FormPicker
          label="Draft Style"
          value={formData.style}
          options={draftStyleOptions}
          onValueChange={(style) =>
            onFormChange({
              style: (style ?? 'SNAKE') as DraftStyle,
            })
          }
          placeholder="Select draft style"
          required
          disabled={isLocked('style')}
        />

        {showDraftDate && (
          <FormInput
            label="Scheduled Start (optional)"
            value={formData.draftDate ?? ''}
            onChangeText={(draftDate) => onFormChange({ draftDate })}
            placeholder="YYYY-MM-DDTHH:mm:ss"
            editable={!isLocked('draftDate')}
          />
        )}

        {showSafetyInfo && formData.seasonId && (
          <View style={styles.deadlockInfoCard}>
            <Text style={styles.deadlockInfoTitle}>Safety info</Text>
            <Text style={styles.deadlockInfoText}>
              Safe team size = Total castaways - Booted castaways
            </Text>
            {loadingCastawayStats ? (
              <Text style={styles.deadlockInfoText}>Calculating available castaways...</Text>
            ) : (
              <>
                <Text style={styles.deadlockInfoText}>
                  Total castaways: {seasonCastawayCount ?? 'Unknown'}
                </Text>
                <Text style={styles.deadlockInfoText}>Booted castaways: {bootsCount}</Text>
                <Text style={styles.deadlockInfoText}>
                  Safe team size: {availableCastaways ?? 'Unknown'}
                </Text>
                {!!teamSizeAvailabilityError && formData.teamSize.trim().length > 0 && (
                  <Text style={styles.teamSizeErrorText}>{teamSizeAvailabilityError}</Text>
                )}
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Scoring</Text>

        <FormInput
          label="First Scoring Episode Number"
          value={formData.firstScoringEpisodeNumber}
          onChangeText={(firstScoringEpisodeNumber) =>
            onFormChange({ firstScoringEpisodeNumber })
          }
          placeholder="e.g., 1"
          error={errors.firstScoringEpisodeNumber}
          keyboardType="number-pad"
          required
          editable={!isLocked('firstScoringEpisodeNumber')}
        />

        <PointRulesInput
          rules={formData.pointRules}
          onChange={(pointRules: LocalRule[]) => onFormChange({ pointRules })}
        />
      </View>

      {showMembersSection && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Members</Text>

          <MembersInput
            members={formData.groupMembers ?? []}
            onChange={(groupMembers: GroupMember[]) => onFormChange({ groupMembers })}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  deadlockInfoCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: 8,
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
    marginTop: Spacing.xs,
  },
  teamSizeErrorText: {
    fontSize: FontSizes.small,
    color: Colors.warning,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
});
