import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../../constants/theme';
import FormInput from '../../../components/shared/FormInput';
import FormPicker, { PickerOption } from '../../../components/shared/FormPicker';
import FormDatePicker from '../../../components/shared/FormDatePicker';
import PointRulesInput, { getDefaultLocalRules, LocalRule } from '../../../components/shared/PointRulesInput';
import MultiPageActions from '../../../components/shared/multipage/MultiPageActions';
import MultiPageProgress from '../../../components/shared/multipage/MultiPageProgress';
import MultiPageStepContainer from '../../../components/shared/multipage/MultiPageStepContainer';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { GroupResponse } from '../../../services/api';
import { Season } from '../../../types/survivor';

interface MultiPageFormData {
  name: string;
  seasonId: number | null;
  teamSize: string;
  style: 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR';
  draftDate: Date | null;
  firstScoringEpisodeNumber: string;
  pointRules: LocalRule[];
}

interface StepConfig {
  title: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    title: 'Basics',
    description: 'Group name and season.',
  },
  {
    title: 'Draft',
    description: 'Draft size, style, and scheduled start.',
  },
  {
    title: 'Scoring',
    description: 'First scoring episode and rules.',
  },
];

const INITIAL_DATA: MultiPageFormData = {
  name: '',
  seasonId: null,
  teamSize: '',
  style: 'SNAKE',
  draftDate: null,
  firstScoringEpisodeNumber: '1',
  pointRules: getDefaultLocalRules(),
};

const draftStyleOptions: PickerOption[] = [
  { label: 'Snake', value: 'SNAKE' },
  { label: 'Round Robin', value: 'ROUND_ROBIN' },
  { label: 'Linear', value: 'LINEAR' },
  { label: 'Rigged (Testing)', value: 'RIGGED' },
];

export default function CreateGroupMultiPageTestingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { setSelectedGroupId, refreshUserGroups } = useGroup();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<MultiPageFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof MultiPageFormData, string>>>({});
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  const activeStep = STEPS[currentStep];
  const isFinalStep = currentStep === STEPS.length - 1;

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        setLoadingSeasons(true);
        const seasonsData = await apiService.getSeasons();
        setSeasons(seasonsData);
      } catch (error) {
        console.error('Failed to load seasons:', error);
        showAlert('Error', 'Failed to load seasons. Please try again.');
      } finally {
        setLoadingSeasons(false);
      }
    };

    loadSeasons();
  }, []);

  const seasonOptions: PickerOption[] = seasons.map((season) => ({
    label: season.seasonName || `Survivor ${season.season}`,
    value: season.season,
  }));

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return !!formData.name.trim() && formData.seasonId != null;
    }
    if (currentStep === 1) {
      return !!formData.teamSize.trim();
    }
    return !!formData.firstScoringEpisodeNumber.trim() && formData.pointRules.length > 0;
  }, [currentStep, formData]);

  const setField = (key: keyof MultiPageFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      const nextErrors: Partial<Record<keyof MultiPageFormData, string>> = {};
      if (!formData.name.trim()) {
        nextErrors.name = 'Group name is required';
      }
      if (formData.seasonId == null) {
        nextErrors.seasonId = 'Season is required';
      }
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return Object.keys(nextErrors).length === 0;
    }

    if (currentStep === 1) {
      const nextErrors: Partial<Record<keyof MultiPageFormData, string>> = {};
      if (!formData.teamSize.trim()) {
        nextErrors.teamSize = 'Team size is required';
      } else if (Number.isNaN(Number.parseInt(formData.teamSize, 10)) || Number.parseInt(formData.teamSize, 10) < 1) {
        nextErrors.teamSize = 'Team size must be a positive number';
      }
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return Object.keys(nextErrors).length === 0;
    }

    const nextErrors: Partial<Record<keyof MultiPageFormData, string>> = {};
    if (!formData.firstScoringEpisodeNumber.trim()) {
      nextErrors.firstScoringEpisodeNumber = 'First scoring episode is required';
    } else if (Number.isNaN(Number.parseInt(formData.firstScoringEpisodeNumber, 10)) || Number.parseInt(formData.firstScoringEpisodeNumber, 10) < 1) {
      nextErrors.firstScoringEpisodeNumber = 'First scoring episode must be 1 or greater';
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (!isFinalStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    try {
      setSubmitting(true);
      if (!user?.id) {
        showAlert('Error', 'You must be signed in to create a group.');
        return;
      }

      const payload: any = {
        name: formData.name.trim(),
        admin: { id: user.id },
        season: { id: formData.seasonId },
        firstScoringEpisodeNumber: Number.parseInt(formData.firstScoringEpisodeNumber, 10),
        draft: {
          teamSize: Number.parseInt(formData.teamSize, 10),
          style: formData.style,
          ...(formData.draftDate ? { scheduledAt: formData.draftDate.toISOString() } : {}),
        },
        pointRules: formData.pointRules.map((rule) => ({
          ruleType: rule.ruleType,
          points: rule.points,
        })),
      };

      const newGroup: GroupResponse = await apiService.createGroup(payload);
      await refreshUserGroups();
      setSelectedGroupId(newGroup.id);
      router.replace('/(player)/group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      router.back();
      return;
    }
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, styles.contentWithFooterPadding]}
        keyboardShouldPersistTaps="handled"
      >
        <MultiPageProgress
          stepTitle={activeStep.title}
          description={activeStep.description}
          currentStep={currentStep + 1}
          totalSteps={STEPS.length}
        />

        <MultiPageStepContainer>
          {currentStep === 0 ? (
            <View>
              <FormInput
                label="Group Name"
                placeholder="Enter group name"
                value={formData.name}
                onChangeText={(value) => setField('name', value)}
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
                  }))
                }
                placeholder={loadingSeasons ? 'Loading seasons...' : 'Select a season'}
                error={errors.seasonId}
                required
                searchable
                disabled={loadingSeasons}
              />
            </View>
          ) : null}

          {currentStep === 1 ? (
            <View>
              <FormInput
                label="Team Size"
                placeholder="e.g., 10"
                value={formData.teamSize}
                onChangeText={(value) => setField('teamSize', value)}
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
                    style: (style ?? 'SNAKE') as MultiPageFormData['style'],
                  }))
                }
                placeholder="Select draft style"
                required
              />
              <FormDatePicker
                label="Scheduled Start"
                value={formData.draftDate}
                onChange={(draftDate) => setFormData((prev) => ({ ...prev, draftDate }))}
                placeholder="No scheduled date"
              />
            </View>
          ) : null}

          {currentStep === 2 ? (
            <View>
              <FormInput
                label="First Scoring Episode Number"
                placeholder="e.g., 1"
                value={formData.firstScoringEpisodeNumber}
                onChangeText={(value) => setField('firstScoringEpisodeNumber', value)}
                error={errors.firstScoringEpisodeNumber}
                keyboardType="number-pad"
                required
              />
              <PointRulesInput
                rules={formData.pointRules}
                onChange={(pointRules) => setFormData((prev) => ({ ...prev, pointRules }))}
              />
            </View>
          ) : null}
        </MultiPageStepContainer>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}> 
        <MultiPageActions
          canGoBack
          isFinalStep={isFinalStep}
          onBack={handleBack}
          onNext={() => {
            void handleNext();
          }}
          nextDisabled={!canProceed || submitting || loadingSeasons}
          submitting={submitting}
          nextLabel="Continue"
          submitLabel="Create Group"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  contentWithFooterPadding: {
    paddingBottom: Spacing.xl * 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});