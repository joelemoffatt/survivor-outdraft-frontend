import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontSizes, Spacing, BorderRadius, Shadow } from '../../../constants/theme';
import Card from '../../../components/shared/Card';

export default function TeamDetailsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Card style={styles.card} shadow="medium">
        <Ionicons name="construct-outline" size={56} color={Colors.primary} style={styles.icon} />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Team details, stats, and history will be available here in a future update.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.medium,
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadow.light,
  },
  backButtonText: {
    color: '#fff',
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
});
