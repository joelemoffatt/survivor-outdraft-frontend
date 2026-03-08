import React from 'react';
import { ScrollView, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { Colors, FontSizes, Spacing, BorderRadius, Shadow } from '../../../constants/theme';
import Card from '../../../components/shared/Card';
import SectionHeader from '../../../components/shared/SectionHeader';
import MenuItem from '../../../components/shared/MenuItem';
import Chip from '../../../components/shared/Chip';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={[styles.profileHeader, Shadow.light]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={Colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.isAdmin && (
            <Chip label="Admin" variant="primary" style={styles.adminChip} />
          )}
        </View>
      </View>

      {/* Profile Actions */}
      <SectionHeader title="Profile" />
      <Card shadow="light" padding="md" style={styles.actionCard}>
        <MenuItem
          icon="create-outline"
          label="Edit Profile"
          onPress={() => router.push('/(player)/profile/edit')}
          showChevron
        />
      </Card>

      {/* Account Actions */}
      <SectionHeader title="Account" />
      <Card shadow="light" padding="md" style={styles.actionCard}>
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push('/(player)/settings/notifications')}
          showChevron
          style={styles.menuItemBorder}
        />
        <MenuItem
          icon="settings-outline"
          label="Preferences"
          onPress={() => router.push('/(player)/settings/preferences')}
          showChevron
        />
      </Card>

      {/* Danger Zone */}
      <Card shadow="light" padding="md" style={styles.dangerCard}>
        <MenuItem
          icon="log-out-outline"
          label="Log Out"
          variant="danger"
          onPress={handleLogout}
          showChevron
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  loadingText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  profileInfo: {
    flex: 1,
  },

  username: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  email: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },

  adminChip: {
    marginTop: Spacing.xs,
  },

  actionCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: Spacing.lg,
  },

  dangerCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: Colors.warningBackground,
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
