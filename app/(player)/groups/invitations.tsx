import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { showAlert } from '../../../utils/alert';
import AppLoader from '../../../components/shared/AppLoader';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import apiService, { GroupMemberResponse } from '../../../services/api';
import useDelayedLoader from '../../../hooks/useDelayedLoader';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';

export default function GroupInvitationsScreen() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<GroupMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<GroupMemberResponse | null>(null);
  const showLoadingSpinner = useDelayedLoader(loading, 200);

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const pendingInvitations = await apiService.getPendingInvitations(user.id);
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      showAlert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number, groupName: string) => {
    try {
      setActionLoading(invitationId);
      await apiService.acceptInvitation(invitationId);
      
      // Remove invitation from local state immediately
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Show success message
      showAlert('Success', `You've joined ${groupName}!`);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      showAlert('Error', 'Failed to accept invitation');
      // Reload invitations to sync state on error
      await loadInvitations();
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setRejectTarget(null);
    try {
      setActionLoading(target.id);
      await apiService.rejectInvitation(target.id);
      setInvitations(prev => prev.filter(inv => inv.id !== target.id));
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      showAlert('Error', 'Failed to reject invitation');
      await loadInvitations();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    if (!showLoadingSpinner) {
      return <View style={styles.centerContainer} />;
    }

    return <AppLoader />;
  }

  if (invitations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="mail-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Pending Invitations</Text>
        <Text style={styles.emptyText}>You don't have any pending group invitations.</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pending Invitations</Text>
      
      {invitations.map((invitation) => (
        <View key={invitation.id} style={styles.invitationCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <View style={styles.cardInfo}>
              <Text style={styles.groupName}>{invitation.group.name}</Text>
              <Text style={styles.invitedDate}>
                Invited {new Date(invitation.joinedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => setRejectTarget(invitation)}
              disabled={actionLoading === invitation.id}
            >
              {actionLoading === invitation.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleAccept(invitation.id, invitation.group.name)}
              disabled={actionLoading === invitation.id}
            >
              {actionLoading === invitation.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>

      <ConfirmDialog
        visible={rejectTarget !== null}
        title="Reject Invitation"
        message={`Are you sure you want to reject the invitation to ${rejectTarget?.group.name}?`}
        confirmText="Reject"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmReject}
        onCancel={() => setRejectTarget(null)}
      />
    </>
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
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  invitedDate: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.warning,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
});
