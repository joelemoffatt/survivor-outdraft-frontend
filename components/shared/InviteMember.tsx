import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import apiService from '../../services/api';

interface InviteMemberProps {
  groupId: number;
  groupName: string;
  onInviteSent?: () => void;
}

export default function InviteMember({ groupId, groupName, onInviteSent }: InviteMemberProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!username.trim()) {
      showAlert('Error', 'Please enter a username');
      return;
    }

    try {
      setLoading(true);
      await apiService.inviteByUsername(groupId, username.trim());
      showAlert('Success', `Invitation sent to ${username}!`);
      setUsername('');
      onInviteSent?.();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-add" size={24} color={Colors.primary} />
        <Text style={styles.title}>Invite Members</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Invite friends to join "{groupName}" by entering their username
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.inviteButton, loading && styles.disabledButton]}
          onPress={handleInvite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.buttonText}>Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.medium,
    backgroundColor: '#f9f9f9',
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 90,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
});
