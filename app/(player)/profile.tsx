import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import apiService, { GroupResponse } from '../../services/api';
import { GroupSelector } from '../../components/shared/GroupSelector';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { selectedGroupId, setSelectedGroupId } = useGroup();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userGroups = await apiService.getUserGroups(user.id);
        setGroups(userGroups);
        if (userGroups.length > 0 && selectedGroupId == null) {
          setSelectedGroupId(userGroups[0].id);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user, selectedGroupId, setSelectedGroupId]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{user?.username || 'Unknown'}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'Unknown'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group</Text>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.infoText}>Loading groups...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.infoText}>No groups available</Text>
        ) : (
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(player)/settings')}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSizes.large,
    color: Colors.text,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  errorText: {
    color: Colors.warning,
    fontSize: FontSizes.medium,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  logoutText: {
    color: Colors.warning,
  },
});
