import { useEffect, useState } from 'react';
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
import { Colors, FontSizes, Spacing, BorderRadius } from '../../../constants/theme';
import FormButton from '../../../components/shared/FormButton';
import FormInput from '../../../components/shared/FormInput';
import { useAuth } from '../../../contexts/AuthContext';
import apiService, { getApiAssetUri, UserRecord } from '../../../services/api';
import useDelayedLoader from '../../../hooks/useDelayedLoader';
import FavoriteCastawaysInput, { FavoriteCastaway } from '../../../components/shared/FavoriteCastawaysInput';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    favoriteCastaways: [] as FavoriteCastaway[],
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    bio: '',
  });

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const loaded = await apiService.getUserById(user.id);
      setProfile(loaded);
      setFormData({
        username: loaded.username,
        email: loaded.email,
        bio: loaded.bio ?? '',
        favoriteCastaways: (loaded.favoriteCastaways ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
        })),
      });
      await updateCurrentUser({
        username: loaded.username,
        email: loaded.email,
        avatarImage: loaded.avatarImage ?? null,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load your profile.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const nextErrors = {
      username: '',
      email: '',
      bio: '',
    };

    let valid = true;

    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
      valid = false;
    } else if (formData.username.trim().length > 50) {
      nextErrors.username = 'Username must be 50 characters or fewer';
      valid = false;
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (formData.bio.length > 1000) {
      nextErrors.bio = 'Bio must be 1000 characters or fewer';
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!profile || !validate()) {
      return;
    }

    try {
      setSaving(true);
      await apiService.updateUser({
        id: profile.id,
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: '',
        role: profile.role,
        enabled: profile.enabled,
        bio: formData.bio,
        favoriteCastaways: formData.favoriteCastaways,
      });

      const refreshed = await apiService.getUserById(profile.id);
      setProfile(refreshed);
      await updateCurrentUser({
        username: refreshed.username,
        email: refreshed.email,
        avatarImage: refreshed.avatarImage ?? null,
      });
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const refreshAvatar = async (userId: number) => {
    const refreshed = await apiService.getUserById(userId);
    const resolvedAvatarUri = getApiAssetUri(refreshed.avatarImage);
    const cacheBustedAvatarUri = resolvedAvatarUri
      ? `${resolvedAvatarUri}${resolvedAvatarUri.includes('?') ? '&' : '?'}t=${Date.now()}`
      : null;

    setProfile({
      ...refreshed,
      avatarImage: cacheBustedAvatarUri,
    });
    setAvatarPreviewUri(null);
    await updateCurrentUser({ avatarImage: cacheBustedAvatarUri });
  };

  const uploadAvatar = async (file: { uri: string; name: string; type: string } | File) => {
    if (!profile) {
      return;
    }

    await apiService.uploadUserAvatar(profile.id, file);
    await refreshAvatar(profile.id);
  };

  const openWebFilePicker = async () => {
    if (typeof document === 'undefined') {
      Alert.alert('Error', 'File upload is unavailable in this environment.');
      return;
    }

    await new Promise<void>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve();
          return;
        }

        try {
          setAvatarBusy(true);
          await uploadAvatar(file);
          Alert.alert('Success', 'Avatar updated.');
        } catch (error) {
          console.error('Failed to upload avatar:', error);
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload avatar.');
        } finally {
          setAvatarBusy(false);
          resolve();
        }
      };
      input.click();
    });
  };

  const handlePickAvatar = async () => {
    if (!profile || avatarBusy) {
      return;
    }

    if (Platform.OS === 'web') {
      await openWebFilePicker();
      return;
    }

    try {
      setAvatarBusy(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to update your avatar.');
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
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileName = asset.fileName || `avatar-${Date.now()}.jpg`;

      setAvatarPreviewUri(asset.uri);
      await uploadAvatar({
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      });
      Alert.alert('Success', 'Avatar updated.');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setAvatarPreviewUri(null);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload avatar.');
    } finally {
      setAvatarBusy(false);
    }
  };


  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const displayedAvatarUri = avatarPreviewUri || getApiAssetUri(profile?.avatarImage);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Update your profile details and avatar.
        </Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatarPreview}>
            {displayedAvatarUri ? (
              <Image source={{ uri: displayedAvatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>
                {(formData.username?.trim().charAt(0) || user?.username?.charAt(0) || '?').toUpperCase()}
              </Text>
            )}

          </View>
          <TouchableOpacity
            style={[styles.avatarActionButton, avatarBusy && styles.avatarActionButtonDisabled]}
            onPress={handlePickAvatar}
            disabled={avatarBusy || saving}
          >
            <Text style={styles.avatarActionButtonText}>
              {avatarBusy ? 'Updating Avatar...' : 'Change Avatar'}
            </Text>
          </TouchableOpacity>
        </View>

        <FormInput
          label="Username"
          value={formData.username}
          onChangeText={(username) => setFormData((prev) => ({ ...prev, username }))}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
          required
        />

        <FormInput
          label="Email"
          value={formData.email}
          onChangeText={(email) => setFormData((prev) => ({ ...prev, email }))}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          required
        />

        <FormInput
          label="Bio"
          value={formData.bio}
          onChangeText={(bio) => setFormData((prev) => ({ ...prev, bio }))}
          error={errors.bio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />

        <FavoriteCastawaysInput
          favoriteCastaways={formData.favoriteCastaways}
          onChange={(favoriteCastaways) =>
            setFormData((prev) => ({ ...prev, favoriteCastaways }))
          }
        />

        <View style={styles.buttonContainer}>
          <FormButton
            title="Save Profile"
            onPress={handleSave}
            loading={saving}
            disabled={saving || avatarBusy}
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
  avatarSection: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarPreview: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarLetter: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: '#fff',
  },
  avatarActionButton: {
    alignSelf: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatarActionButtonDisabled: {
    opacity: 0.7,
  },
  avatarActionButtonText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
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
