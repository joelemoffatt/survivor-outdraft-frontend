import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="notifications-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.title}>No Notifications</Text>
      <Text style={styles.subtitle}>You're all caught up.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    marginTop: Spacing.md,
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
});
