import { useEffect, useMemo, useState } from 'react';
import AppLoader from '../../../../components/shared/AppLoader';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../../constants/theme';
import { PickerOption } from '../../../../components/shared/FormPicker';
import FormInput from '../../../../components/shared/FormInput';
import FormPicker from '../../../../components/shared/FormPicker';
import FormDatePicker from '../../../../components/shared/FormDatePicker';
import FormButton from '../../../../components/shared/FormButton';
import PointRulesInput, { LocalRule } from '../../../../components/shared/PointRulesInput';
import { ConfirmDialog } from '../../../../components/shared/ConfirmDialog';
import AvatarCircle from '../../../../components/shared/AvatarCircle';
import apiService, { GroupMemberResponse, GroupResponse } from '../../../../services/api';
import { Episode, Season } from '../../../../types/survivor';
import useDelayedLoader from '../../../../hooks/useDelayedLoader';
import { useGroup } from '../../../../contexts/GroupContext';

type Tab = 'details' | 'draft' | 'scoring' | 'members';

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'draft', label: 'Draft' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'members', label: 'Members' },
];

const draftStyleOptions: PickerOption[] = [
  { label: 'Snake', value: 'SNAKE' },
  { label: 'Round Robin', value: 'ROUND_ROBIN' },
  { label: 'Linear', value: 'LINEAR' },
];

export default function ManageGroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = Number(params.id);
  const { refreshGroupData, setSelectedGroupId } = useGroup();

  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingDraft, setResettingDraft] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [deleteGroupModalVisible, setDeleteGroupModalVisible] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const showLoadingSpinner = useDelayedLoader(loading || loadingSeasons, 200);

  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);

  // Members tab state
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [addMemberUsername, setAddMemberUsername] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<GroupMemberResponse | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    seasonId: null as number | null,
    latestWatchedEpisodeId: null as number | null,
    firstScoringEpisodeNumber: '1',
    teamSize: '',
    style: 'SNAKE' as 'SNAKE' | 'ROUND_ROBIN' | 'LINEAR',
    draftDate: null as Date | null,
    pointRules: [] as LocalRule[],
  });

  const [errors, setErrors] = useState({
    name: '',
    seasonId: '',
    firstScoringEpisodeNumber: '',
    teamSize: '',
  });

  useEffect(() => {
    loadInitialData();
  }, [groupId]);

  useEffect(() => {
    if (!formData.seasonId) {
      setEpisodes([]);
      return;
    }
    let active = true;
    setLoadingEpisodes(true);
    apiService.getEpisodes(formData.seasonId)
      .then((data) => { if (active) setEpisodes(data); })
      .catch(() => Alert.alert('Error', 'Failed to load episodes.'))
      .finally(() => { if (active) setLoadingEpisodes(false); });
    return () => { active = false; };
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
      setMembers(membersData);
      setFormData({
        name: groupData.name,
        seasonId: groupData.season.id,
        latestWatchedEpisodeId: groupData.latestEpisodeWatched?.id ?? null,
        firstScoringEpisodeNumber: String(groupData.firstScoringEpisodeNumber ?? 1),
        teamSize: String(groupData.draft?.teamSize ?? ''),
        style: groupData.draft?.style ?? 'SNAKE',
        draftDate: groupData.draft?.scheduledAt ? new Date(groupData.draft.scheduledAt) : null,
        pointRules: (groupData.pointRules ?? []).map((r) => ({
          ruleType: r.ruleType as LocalRule['ruleType'],
          points: r.points,
        })),
      });
    } catch {
      Alert.alert('Error', 'Failed to load group settings.');
      router.back();
    } finally {
      setLoading(false);
      setLoadingSeasons(false);
    }
  };

  const patchForm = (patch: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const isDraftCompleted = group?.draft?.status === 'COMPLETED';
  const isDraftPending = !group?.draft || group.draft.status === 'PENDING';

  const seasonOptions: PickerOption[] = seasons.map((s) => ({
    label: s.seasonName || `Survivor ${s.season}`,
    value: s.season,
  }));

  const episodeOptions: PickerOption[] = [
    { label: "Haven't watched any episodes", value: null },
    ...episodes.map((ep) => ({
      label: `Episode ${ep.episodeNumber}${ep.episodeTitle ? ` - ${ep.episodeTitle}` : ''}`,
      value: ep.id,
    })),
  ];

  const watchedEpisode = useMemo(
    () => episodes.find((ep) => ep.id === formData.latestWatchedEpisodeId),
    [episodes, formData.latestWatchedEpisodeId]
  );

  // Build the full API payload from current formData
  const buildPayload = () => ({
    name: formData.name.trim(),
    seasonId: Number(formData.seasonId),
    latestWatchedEpisodeId: formData.latestWatchedEpisodeId,
    firstScoringEpisodeNumber: parseInt(formData.firstScoringEpisodeNumber, 10),
    draft: {
      teamSize: parseInt(formData.teamSize, 10),
      style: formData.style,
      ...(formData.draftDate ? { scheduledAt: formData.draftDate.toISOString() } : {}),
    },
    pointRules: formData.pointRules.map((r) => ({ ruleType: r.ruleType, points: r.points })),
  });

  const validateDetails = () => {
    const errs = { ...errors };
    let ok = true;
    if (!formData.name.trim()) { errs.name = 'Group name is required'; ok = false; }
    else if (formData.name.length > 100) { errs.name = 'Must be under 100 characters'; ok = false; }
    else errs.name = '';
    if (!formData.seasonId) { errs.seasonId = 'Season is required'; ok = false; }
    else errs.seasonId = '';
    setErrors(errs);
    return ok;
  };

  const validateDraft = () => {
    const errs = { ...errors };
    let ok = true;
    const n = parseInt(formData.teamSize, 10);
    if (!formData.teamSize.trim()) { errs.teamSize = 'Team size is required'; ok = false; }
    else if (isNaN(n) || n < 1) { errs.teamSize = 'Must be a positive number'; ok = false; }
    else errs.teamSize = '';
    setErrors(errs);
    return ok;
  };

  const validateScoring = () => {
    const errs = { ...errors };
    let ok = true;
    const n = parseInt(formData.firstScoringEpisodeNumber, 10);
    if (!formData.firstScoringEpisodeNumber.trim()) {
      errs.firstScoringEpisodeNumber = 'Required'; ok = false;
    } else if (isNaN(n) || n < 1) {
      errs.firstScoringEpisodeNumber = 'Must be 1 or greater'; ok = false;
    } else if (watchedEpisode && n > watchedEpisode.episodeNumber) {
      errs.firstScoringEpisodeNumber = 'Cannot exceed latest watched episode'; ok = false;
    } else {
      errs.firstScoringEpisodeNumber = '';
    }
    setErrors(errs);
    return ok;
  };

  const handleSave = async (validate: () => boolean) => {
    if (!validate()) return;
    try {
      setSaving(true);
      const updated = await apiService.updateGroupSettings(groupId, buildPayload());
      setGroup(updated);
      setFormData((prev) => ({
        ...prev,
        draftDate: updated.draft?.scheduledAt ? new Date(updated.draft.scheduledAt) : null,
        pointRules: (updated.pointRules ?? []).map((r) => ({
          ruleType: r.ruleType as LocalRule['ruleType'],
          points: r.points,
        })),
      }));
      await refreshGroupData();
      Alert.alert('Saved', 'Group settings updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save settings.');
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
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset draft.');
    } finally {
      setResettingDraft(false);
    }
  };

  const confirmDeleteGroup = async () => {
    try {
      setDeleteGroupModalVisible(false);
      setDeletingGroup(true);
      await apiService.deleteGroup(groupId);
      await refreshGroupData();
      setSelectedGroupId(null);
      router.replace('/(player)/groups/select');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete group.');
      setDeletingGroup(false);
    }
  };

  const handleAddMember = async () => {
    if (!addMemberUsername.trim()) return;
    try {
      setAddMemberLoading(true);
      await apiService.inviteByUsername(groupId, addMemberUsername.trim());
      setAddMemberUsername('');
      setAddMemberModalVisible(false);
      const fresh = await apiService.getGroupMembers(groupId);
      setMembers(fresh);
    } catch (err: any) {
      Alert.alert('Invite Failed', err?.message ?? 'Could not invite user.');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberTarget) return;
    const target = removeMemberTarget;
    setRemoveMemberTarget(null);
    try {
      await apiService.cancelInvitation(target.id);
      setMembers((prev) => prev.filter((m) => m.id !== target.id));
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to remove member.');
    }
  };

  const getMemberStatusStyle = (status: GroupMemberResponse['status']) => {
    switch (status) {
      case 'ACCEPTED': return { badge: styles.statusBadgeActive, text: styles.statusTextActive };
      case 'INVITED': return { badge: styles.statusBadgePending, text: styles.statusTextPending };
      case 'DECLINED': return { badge: styles.statusBadgeDeclined, text: styles.statusTextDeclined };
    }
  };

  if (loading || loadingSeasons) {
    if (!showLoadingSpinner) return <View style={styles.container} />;
    return <AppLoader />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <FormInput
            label="Group Name"
            value={formData.name}
            onChangeText={(name) => patchForm({ name })}
            placeholder="Enter group name"
            error={errors.name}
            required
            maxLength={100}
          />

          <FormPicker
            label="Season"
            value={formData.seasonId}
            options={seasonOptions}
            onValueChange={(seasonId) =>
              patchForm({
                seasonId: seasonId == null ? null : Number(seasonId),
                latestWatchedEpisodeId: null,
                firstScoringEpisodeNumber: '1',
              })
            }
            placeholder={loadingSeasons ? 'Loading seasons…' : 'Select a season'}
            error={errors.seasonId}
            required
            searchable
            locked={isDraftCompleted}
            disabled={isDraftCompleted}
          />

          <FormPicker
            label="Latest Episode Watched"
            value={formData.latestWatchedEpisodeId}
            options={episodeOptions}
            onValueChange={(id) =>
              patchForm({ latestWatchedEpisodeId: id == null ? null : Number(id) })
            }
            placeholder={
              !formData.seasonId
                ? 'Choose season first'
                : loadingEpisodes
                ? 'Loading episodes…'
                : 'None (all castaways visible)'
            }
            searchable
            disabled={!formData.seasonId}
          />

          <View style={styles.buttonGroup}>
            <FormButton
              title="Save Details"
              onPress={() => handleSave(validateDetails)}
              loading={saving}
              disabled={saving || loadingEpisodes}
            />
            <FormButton
              title={deletingGroup ? 'Deleting…' : 'Delete Group'}
              onPress={() => setDeleteGroupModalVisible(true)}
              disabled={saving || deletingGroup}
              variant="danger"
            />
          </View>
        </ScrollView>
      )}

      {/* Draft Tab */}
      {activeTab === 'draft' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <FormInput
            label="Team Size"
            value={formData.teamSize}
            onChangeText={(teamSize) => patchForm({ teamSize })}
            placeholder="e.g., 10"
            error={errors.teamSize}
            keyboardType="number-pad"
            required
            locked={isDraftCompleted}
            editable={!!formData.seasonId && !isDraftCompleted}
          />

          <FormPicker
            label="Draft Style"
            value={formData.style}
            options={draftStyleOptions}
            onValueChange={(style) =>
              patchForm({ style: (style ?? 'SNAKE') as typeof formData.style })
            }
            placeholder="Select draft style"
            required
            locked={isDraftCompleted}
            disabled={isDraftCompleted}
          />

          <FormDatePicker
            label="Scheduled Start (optional)"
            value={formData.draftDate}
            onChange={(draftDate) => patchForm({ draftDate })}
            placeholder="No scheduled date"
            disabled={isDraftCompleted}
            locked={isDraftCompleted}
          />

          <View style={styles.buttonGroup}>
            <FormButton
              title="Save Draft Settings"
              onPress={() => handleSave(validateDraft)}
              loading={saving}
              disabled={saving || loadingEpisodes}
            />
            <FormButton
              title="Reset Draft"
              onPress={() => setResetModalVisible(true)}
              loading={resettingDraft}
              disabled={saving || resettingDraft}
              variant="danger"
            />
          </View>
        </ScrollView>
      )}

      {/* Scoring Tab */}
      {activeTab === 'scoring' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <FormInput
            label="First Scoring Episode Number"
            value={formData.firstScoringEpisodeNumber}
            onChangeText={(firstScoringEpisodeNumber) => patchForm({ firstScoringEpisodeNumber })}
            placeholder="e.g., 1"
            error={errors.firstScoringEpisodeNumber}
            keyboardType="number-pad"
            required
          />

          <PointRulesInput
            rules={formData.pointRules}
            onChange={(pointRules) => patchForm({ pointRules })}
          />

          <View style={styles.buttonGroup}>
            <FormButton
              title="Save Scoring Settings"
              onPress={() => handleSave(validateScoring)}
              loading={saving}
              disabled={saving}
            />
          </View>
        </ScrollView>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!isDraftPending && (
            <View style={styles.lockedBanner}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.lockedText}>Members are locked after the draft starts.</Text>
            </View>
          )}

          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members yet.</Text>
          ) : (
            members.map((m, index) => {
              const isAdmin = m.user.id === group?.admin?.id;
              const statusStyle = getMemberStatusStyle(m.status);
              return (
                <View
                  key={m.id}
                  style={[styles.memberRow, index < members.length - 1 && styles.memberRowBorder]}
                >
                  <AvatarCircle size={36} fallbackText={m.user.username} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.user.username}</Text>
                    {isAdmin && <Text style={styles.adminLabel}>Admin</Text>}
                  </View>
                  <View style={[styles.statusBadge, statusStyle.badge]}>
                    <Text style={[styles.statusText, statusStyle.text]}>
                      {m.status === 'ACCEPTED' ? 'Joined' : m.status === 'INVITED' ? 'Invited' : 'Declined'}
                    </Text>
                  </View>
                  {!isAdmin && isDraftPending && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => setRemoveMemberTarget(m)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.warning} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          {isDraftPending && (
            <TouchableOpacity
              style={styles.addMemberRow}
              onPress={() => setAddMemberModalVisible(true)}
            >
              <View style={styles.addMemberIcon}>
                <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.addMemberText}>Add Member</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Reset Draft confirmation */}
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

      {/* Delete Group confirmation */}
      <ConfirmDialog
        visible={deleteGroupModalVisible}
        title="Delete Group"
        message={`Permanently delete "${group?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onCancel={() => setDeleteGroupModalVisible(false)}
        onConfirm={confirmDeleteGroup}
      />

      {/* Remove Member confirmation */}
      <ConfirmDialog
        visible={removeMemberTarget !== null}
        title="Remove Member"
        message={`Remove ${removeMemberTarget?.user.username} from this group?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
        onCancel={() => setRemoveMemberTarget(null)}
        onConfirm={confirmRemoveMember}
      />

      {/* Add Member modal */}
      <Modal
        visible={addMemberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAddMemberModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                value={addMemberUsername}
                onChangeText={setAddMemberUsername}
                placeholder="Enter username"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[
                  styles.modalAddButton,
                  (!addMemberUsername.trim() || addMemberLoading) && styles.modalAddButtonDisabled,
                ]}
                onPress={handleAddMember}
                disabled={!addMemberUsername.trim() || addMemberLoading}
              >
                <Text style={styles.modalAddButtonText}>
                  {addMemberLoading ? 'Inviting…' : 'Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: Colors.primary,
  },

  // Content
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl },

  buttonGroup: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },

  // Members list (mirrors group.tsx style)
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.lightBackground,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  lockedText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {},
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
  },
  adminLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  statusBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: '700',
  },
  statusBadgeActive: { backgroundColor: Colors.successBackground },
  statusTextActive: { color: Colors.success },
  statusBadgePending: { backgroundColor: Colors.warningBackground },
  statusTextPending: { color: Colors.primary },
  statusBadgeDeclined: { backgroundColor: Colors.lightBackground },
  statusTextDeclined: { color: Colors.textSecondary },
  deleteButton: {
    padding: Spacing.xs,
  },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  addMemberIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberText: {
    color: Colors.primary,
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },

  // Add member modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  modalAddButton: {
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#fff',
  },
});
