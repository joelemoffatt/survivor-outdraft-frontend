import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import apiService, { GroupResponse } from '../../services/api';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
    router.replace('/login');
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Groups',
      items: [
        {
          label: 'Select Group',
          icon: 'people',
          onPress: () => router.push('/(player)/groups/select'),
        },
        {
          label: 'Create Group',
          icon: 'add-circle',
          onPress: () => router.push('/(player)/groups/create'),
        },
        {
          label: 'Manage Groups',
          icon: 'settings',
          onPress: () => router.push('/(player)/groups/manage'),
        },
        {
          label: 'Group Invitations',
          icon: 'mail',
          onPress: () => router.push('/(player)/groups/invitations'),
        },
        {
          label: 'Group Details',
          icon: 'information-circle',
          onPress: () => router.push('/(player)/groups/details'),
        },
      ],
    },
    {
      title: 'History',
      items: [
        {
          label: 'Seasons',
          icon: 'calendar',
          onPress: () => router.push('/(player)/history/seasons'),
        },
        {
          label: 'Episodes',
          icon: 'film',
          onPress: () => router.push('/(player)/history/episodes'),
        },
        {
          label: 'Castaways',
          icon: 'person-outline',
          onPress: () => router.push('/(player)/history/castaways'),
        },
        {
          label: 'Tribes',
          icon: 'people-outline',
          onPress: () => router.push('/(player)/history/tribes'),
        },
        {
          label: 'Challenges',
          icon: 'fitness',
          onPress: () => router.push('/(player)/history/challenges'),
        },
        {
          label: 'Tribals',
          icon: 'flame',
          onPress: () => router.push('/(player)/history/tribals'),
        },
        {
          label: 'Votes',
          icon: 'checkbox',
          onPress: () => router.push('/(player)/history/votes'),
        },
        {
          label: 'Advantages',
          icon: 'star',
          onPress: () => router.push('/(player)/history/advantages'),
        },
        {
          label: 'Journeys',
          icon: 'map',
          onPress: () => router.push('/(player)/history/journeys'),
        },
        {
          label: 'Boots',
          icon: 'exit',
          onPress: () => router.push('/(player)/history/boots'),
        },
        {
          label: 'Results',
          icon: 'trophy',
          onPress: () => router.push('/(player)/history/results'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          label: 'Notifications',
          icon: 'notifications',
          onPress: () => router.push('/(player)/settings/notifications'),
        },
        {
          label: 'App Preferences',
          icon: 'settings',
          onPress: () => router.push('/(player)/settings/preferences'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          label: 'Terms of Service',
          icon: 'document-text',
          onPress: () => router.push('/(player)/settings/terms'),
        },
        {
          label: 'About This App',
          icon: 'information-circle',
          onPress: () => router.push('/(player)/settings/about'),
        },
      ],
    },
    {
      items: [
        {
          label: 'Logout',
          icon: 'log-out',
          onPress: handleLogout,
          variant: 'danger',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{user?.username || 'Unknown'}</Text>
            <Text style={styles.email}>{user?.email || 'Unknown'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(player)/more_folder/edit')}>
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {menuSections.map((section, index) => (
        <View key={section.title || `section-${index}`} style={styles.section}>
          {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
          <View style={styles.menuItems}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index !== section.items.length - 1 && styles.menuItemBorder,
                  item.variant === 'danger' && styles.dangerItem,
                ]}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={item.variant === 'danger' ? Colors.warning : Colors.text}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuLabel, item.variant === 'danger' && styles.dangerText]}>
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.variant === 'danger' ? Colors.warning : Colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <ConfirmDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: '#fff',
  },
  userDetails: {
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
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editButtonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '700',
    color: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItems: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#fff',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: Spacing.md,
    width: 24,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
  },
  dangerItem: {
    backgroundColor: '#fff8f7',
  },
  dangerText: {
    color: Colors.warning,
  },
});
