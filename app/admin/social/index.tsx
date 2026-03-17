import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../../components/shared/Card';
import { socialObjectSpecs } from '../../../components/admin/resourceConfigs';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function AdminSocialScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Admin Social Objects</Text>
      <Text style={styles.subtitle}>Select an object to open its table page.</Text>

      {socialObjectSpecs.map((item) => (
        <TouchableOpacity
          key={item.key}
          onPress={() => router.push(`/admin/social/${item.key}`)}
          activeOpacity={0.8}
        >
          <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.label}</Text>
              <Text style={[styles.statusBadge, item.crudReady ? styles.readyBadge : styles.partialBadge]}>
                {item.crudReady ? 'Ready' : 'Spec'}
              </Text>
            </View>
            <Text style={styles.itemText}>{item.description}</Text>
            <Text style={styles.itemMeta}>Table: {item.tableEndpoint}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.adminBackground,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  itemCard: {
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  itemTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    fontSize: FontSizes.small,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
  },
  readyBadge: {
    color: Colors.success,
    backgroundColor: Colors.successBackground,
  },
  partialBadge: {
    color: Colors.textSecondary,
    backgroundColor: Colors.lightBackground,
  },
  itemText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  itemMeta: {
    fontSize: FontSizes.small,
    color: Colors.textLight,
  },
});
