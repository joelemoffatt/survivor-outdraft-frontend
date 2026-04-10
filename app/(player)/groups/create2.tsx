import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import FormInput from '../../../components/shared/FormInput';
import MultiPageActions from '../../../components/shared/multipage/MultiPageActions';
import MultiPageProgress from '../../../components/shared/multipage/MultiPageProgress';
import MultiPageStepContainer from '../../../components/shared/multipage/MultiPageStepContainer';

interface MultiPageFormData {
  groupName: string;
  groupCode: string;
  draftTheme: string;
  welcomeMessage: string;
  inviteName: string;
  inviteEmail: string;
}

interface StepConfig {
  title: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    title: 'Basics',
    description: 'Testing fields for core group information.',
  },
  {
    title: 'Experience',
    description: 'Testing fields for how this group should feel.',
  },
  {
    title: 'Invite',
    description: 'Testing fields for inviting one player.',
  },
];

const INITIAL_DATA: MultiPageFormData = {
  groupName: '',
  groupCode: '',
  draftTheme: '',
  welcomeMessage: '',
  inviteName: '',
  inviteEmail: '',
};

export default function CreateGroupMultiPageTestingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<MultiPageFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof MultiPageFormData, string>>>({});

  const activeStep = STEPS[currentStep];
  const isFinalStep = currentStep === STEPS.length - 1;

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return !!formData.groupName.trim() && !!formData.groupCode.trim();
    }
    if (currentStep === 1) {
      return !!formData.draftTheme.trim() && !!formData.welcomeMessage.trim();
    }
    return !!formData.inviteName.trim() && !!formData.inviteEmail.trim();
  }, [currentStep, formData]);

  const setField = (key: keyof MultiPageFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      const nextErrors: Partial<Record<keyof MultiPageFormData, string>> = {};
      if (!formData.groupName.trim()) {
        nextErrors.groupName = 'Group name is required';
      }
      if (!formData.groupCode.trim()) {
        nextErrors.groupCode = 'Group code is required';
      }
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return Object.keys(nextErrors).length === 0;
    }

    if (currentStep === 1) {
      const nextErrors: Partial<Record<keyof MultiPageFormData, string>> = {};
      if (!formData.draftTheme.trim()) {
        nextErrors.draftTheme = 'Draft theme is required';
      }
      if (!formData.welcomeMessage.trim()) {
        nextErrors.welcomeMessage = 'Welcome message is required';
      }
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return Object.keys(nextErrors).length === 0;
    }

    const nextErrors: Partial<Record<keyof MultiPageFormData, string>> = {};
    if (!formData.inviteName.trim()) {
      nextErrors.inviteName = 'Invite name is required';
    }
    if (!formData.inviteEmail.trim()) {
      nextErrors.inviteEmail = 'Invite email is required';
    } else if (!formData.inviteEmail.includes('@')) {
      nextErrors.inviteEmail = 'Invite email must include @';
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
      await new Promise((resolve) => setTimeout(resolve, 300));
      Alert.alert(
        'Testing Submission',
        `This is test content only.\n\n${JSON.stringify(formData, null, 2)}`,
      );
      setCurrentStep(0);
      setFormData(INITIAL_DATA);
      setErrors({});
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
                label="Group Name (Test)"
                placeholder="Ex: Winners at Camp"
                value={formData.groupName}
                onChangeText={(value) => setField('groupName', value)}
                error={errors.groupName}
                required
              />
              <FormInput
                label="Group Code (Test)"
                placeholder="Ex: WAC2026"
                value={formData.groupCode}
                onChangeText={(value) => setField('groupCode', value)}
                autoCapitalize="characters"
                error={errors.groupCode}
                required
              />
            </View>
          ) : null}

          {currentStep === 1 ? (
            <View>
              <FormInput
                label="Draft Theme (Test)"
                placeholder="Ex: Old School"
                value={formData.draftTheme}
                onChangeText={(value) => setField('draftTheme', value)}
                error={errors.draftTheme}
                required
              />
              <FormInput
                label="Welcome Message (Test)"
                placeholder="Ex: No spoilers after Thursday night"
                value={formData.welcomeMessage}
                onChangeText={(value) => setField('welcomeMessage', value)}
                error={errors.welcomeMessage}
                required
              />
            </View>
          ) : null}

          {currentStep === 2 ? (
            <View>
              <FormInput
                label="Invite Name (Test)"
                placeholder="Ex: Jeff Fan"
                value={formData.inviteName}
                onChangeText={(value) => setField('inviteName', value)}
                error={errors.inviteName}
                required
              />
              <FormInput
                label="Invite Email (Test)"
                placeholder="Ex: jeff@example.com"
                value={formData.inviteEmail}
                onChangeText={(value) => setField('inviteEmail', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.inviteEmail}
                required
              />

              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Testing Summary</Text>
                <Text style={styles.previewText}>Group: {formData.groupName || '-'}</Text>
                <Text style={styles.previewText}>Code: {formData.groupCode || '-'}</Text>
                <Text style={styles.previewText}>Theme: {formData.draftTheme || '-'}</Text>
              </View>
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
          nextDisabled={!canProceed || submitting}
          submitting={submitting}
          nextLabel="Continue"
          submitLabel="Submit Test"
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
  previewCard: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
    padding: Spacing.md,
  },
  previewTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  previewText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});