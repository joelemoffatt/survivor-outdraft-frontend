import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>About This App</Text>
      <View style={styles.card}>
        <Text style={styles.label}>App Name</Text>
        <Text style={styles.value}>Survivor OutDraft</Text>
        
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>1.0.0</Text>
        
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>
          A fantasy draft app for Survivor fans. Create leagues, draft castaways, and compete with friends.
        </Text>
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
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: 22,
  },
});
