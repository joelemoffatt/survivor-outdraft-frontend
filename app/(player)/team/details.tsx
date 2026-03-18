import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontSizes, Spacing, Shadow } from '../../../constants/theme';
import Card from '../../../components/shared/Card';
import BackButton from '../../../components/shared/BackButton';

export default function TeamDetailsScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card} shadow="medium">
        <Ionicons name="construct-outline" size={56} color={Colors.primary} style={styles.icon} />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Team details, stats, and history will be available here in a future update.
        </Text>
        <BackButton label="Go Back" />
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
});
