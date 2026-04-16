import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../constants/theme';
import FormInput from '../../../components/shared/FormInput';
import FormButton from '../../../components/shared/FormButton';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroup } from '../../../contexts/GroupContext';
import apiService, { getApiAssetUri, TeamResponse } from '../../../services/api';

export default function EditTeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedGroupId } = useGroup();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [teamName, setTeamName] = useState('');
  const [nameError, setNameError] = useState('');
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string } | File | null>(null);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    const loadTeam = async () => {
      if (!user?.id || !selectedGroupId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const teamData = await apiService.getTeamByGroupAndUser(selectedGroupId, user.id);
        setTeam(teamData);
        setTeamName(teamData.teamName ?? '');
      } catch (error) {
        console.error('Failed to load team profile:', error);
        Alert.alert('Error', 'Failed to load team profile.');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [selectedGroupId, user?.id]);

  const displayedAvatarUri = useMemo(() => {
    if (avatarPreviewUri) {
      return avatarPreviewUri;
    }
    if (pickedFile && typeof File === 'undefined' && 'uri' in pickedFile) {
      return pickedFile.uri;
    }
    return getApiAssetUri(team?.avatarImage);
  }, [avatarPreviewUri, pickedFile, team?.avatarImage]);

  const handlePickAvatar = async () => {
    if (saving) return;

    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') {
        Alert.alert('Error', 'File upload is unavailable in this environment.');
        return;
      }

      await new Promise<void>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            resolve();
            return;
          }
          setPickedFile(file);
          setAvatarPreviewUri(URL.createObjectURL(file));
          resolve();
        };
        input.click();
      });
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to update your team avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const nextPickedFile = {
        uri: asset.uri,
        name: asset.fileName || `team-avatar-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      setPickedFile(nextPickedFile);
      setAvatarPreviewUri(asset.uri);
    } catch (error) {
      console.error('Failed to open image picker:', error);
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

  const handleSave = async () => {
    if (!team) {
      return;
    }

    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setNameError('Team name is required');
      return;
    }
    if (trimmedName.length > 100) {
      setNameError('Team name must be 100 characters or fewer');
      return;
    }
    setNameError('');

    try {
      setSaving(true);
      const updated = await apiService.updateTeamProfile(team.id, {
        teamName: trimmedName,
        file: pickedFile ?? undefined,
      });
      const resolvedAvatar = getApiAssetUri(updated.avatarImage);
      const cacheBustedAvatar = resolvedAvatar
        ? `${resolvedAvatar}${resolvedAvatar.includes('?') ? '&' : '?'}t=${Date.now()}`
        : null;
      setTeam({
        ...updated,
        avatarImage: cacheBustedAvatar,
      });
      setTeamName(updated.teamName ?? trimmedName);
      setPickedFile(null);
      setAvatarPreviewUri(null);
      Alert.alert('Success', 'Team profile updated.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(player)/team'),
        },
      ]);
    } catch (error) {
      console.error('Failed to update team profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update team profile.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreviewUri && avatarPreviewUri.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUri);
      }
    };
  }, [avatarPreviewUri]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Team</Text>
        <Text style={styles.subtitle}>Update your team name and avatar.</Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatarPreview}>
            {displayedAvatarUri ? (
              <Image source={{ uri: displayedAvatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>
                {(teamName.trim().charAt(0) || team?.teamName?.charAt(0) || '?').toUpperCase()}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handlePickAvatar}
            disabled={saving || loading}
          >
            <Text style={styles.avatarButtonText}>Change Team Avatar</Text>
          </TouchableOpacity>
        </View>

        <FormInput
          label="Team Name"
          value={teamName}
          onChangeText={setTeamName}
          error={nameError}
          autoCapitalize="words"
          autoCorrect={false}
          required
        />

        <FormButton
          title={saving ? 'Saving...' : 'Save Team Profile'}
          onPress={handleSave}
          loading={saving}
          disabled={saving || loading}
        />
      </ScrollView>
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
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  avatarSection: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  avatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
  },
  avatarLetter: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: '#fff',
  },
  avatarButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatarButtonText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
});
