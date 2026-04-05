import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export type MembershipStatus = 'PENDING' | 'INVITED' | 'ACCEPTED' | 'DECLINED';

export interface GroupMember {
  id: string;
  memberId?: number;
  username: string;
  status: MembershipStatus;
  isAdmin?: boolean;
}

interface MembersInputProps {
  members: GroupMember[];
  onChange: (members: GroupMember[]) => void;
  availableUsers?: Array<{ id: string; username: string }>;
  style?: StyleProp<ViewStyle>;
}

const statusColors: Record<MembershipStatus, string> = {
  PENDING: '#FFA500',
  INVITED: '#FFA500',
  ACCEPTED: '#4CAF50',
  DECLINED: '#F44336',
};

const statusLabels: Record<MembershipStatus, string> = {
  PENDING: 'Pending',
  INVITED: 'Invited',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
};

interface MemberRowProps {
  member: GroupMember;
  index: number;
  onDelete: (index: number) => void;
}

function MemberRow({ member, index, onDelete }: MemberRowProps) {
  return (
    <View style={styles.memberRow}>
      <Text style={styles.memberUsername}>{member.username}</Text>
      {member.isAdmin && (
        <View style={styles.adminChip}>
          <Text style={styles.adminChipText}>Admin</Text>
        </View>
      )}
      <View
        style={[
          styles.statusChip,
          { backgroundColor: statusColors[member.status] },
        ]}
      >
        <Text style={styles.statusText}>{statusLabels[member.status]}</Text>
      </View>
      {!member.isAdmin && (
        <TouchableOpacity onPress={() => onDelete(index)}>
          <Ionicons name="trash" size={20} color={Colors.warning} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MembersInput({
  members,
  onChange,
  availableUsers = [],
  style,
}: MembersInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  const handleAddMember = () => {
    if (usernameInput.trim()) {
      const newMember: GroupMember = {
        id: `new-${Date.now()}`,
        username: usernameInput.trim(),
        status: 'INVITED',
      };
      onChange([...members, newMember]);
      setUsernameInput('');
      setModalVisible(false);
    }
  };

  const handleDeleteMember = (index: number) => {
    if (members[index]?.isAdmin) {
      return;
    }
    onChange(members.filter((_, i) => i !== index));
  };

  return (
    <View style={[styles.container, style]}>
      {members.length === 0 ? (
        <Text style={styles.emptyText}>No members added yet</Text>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(_, index) => String(index)}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <MemberRow
              member={item}
              index={index}
              onDelete={handleDeleteMember}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text style={styles.addButtonText}>Add Member</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Enter username"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddMember}
                disabled={!usernameInput.trim()}
              >
                <Text style={styles.modalAddButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    height: 54,
  },
  memberUsername: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '500',
  },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '600',
  },
  adminChip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.textSecondary,
  },
  adminChipText: {
    fontSize: FontSizes.small,
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    gap: Spacing.sm,
    backgroundColor: '#fff',
  },
  addButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  modalAddButton: {
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  modalAddButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#fff',
  },
});
