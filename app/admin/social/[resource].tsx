import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GenericCrudTablePage from '../../../components/admin/GenericCrudTablePage';
import Card from '../../../components/shared/Card';
import FormButton from '../../../components/shared/FormButton';
import {
  getSocialObjectSpec,
  socialCrudConfigMap,
  socialObjectSpecs,
  SocialResourceKey,
} from '../../../components/admin/resourceConfigs';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function AdminSocialResourceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resource?: string }>();
  const resource = typeof params.resource === 'string' ? params.resource : '';

  const config = socialCrudConfigMap[resource as SocialResourceKey];
  const spec = getSocialObjectSpec(resource);

  if (config) {
    return (
      <GenericCrudTablePage
        config={config}
        resourceKey={resource}
        editRoutePath="/admin/create"
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Social Object Table</Text>
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>{spec ? spec.label : 'Unknown Resource'}</Text>
        <Text style={styles.infoText}>
          {spec
            ? `${spec.description} CRUD table/form wiring is not implemented yet.`
            : 'Resource was not found in the social object catalog.'}
        </Text>
        <FormButton title="Back to Social Objects" onPress={() => router.push('/admin/social')} />
      </Card>

      {spec ? (
        <Card>
          <Text style={styles.sectionTitle}>Fields</Text>
          {spec.fields.map((field) => (
            <Text key={field} style={styles.bullet}>• {field}</Text>
          ))}

          <Text style={styles.sectionTitle}>Relationships</Text>
          {spec.relationships.map((relation) => (
            <Text key={relation} style={styles.bullet}>• {relation}</Text>
          ))}

          <Text style={styles.sectionTitle}>List Connections</Text>
          {spec.listConnections.map((endpoint) => (
            <Text key={endpoint} style={styles.bullet}>• {endpoint}</Text>
          ))}

          {spec.notes?.length ? (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              {spec.notes.map((note) => (
                <Text key={note} style={styles.bullet}>• {note}</Text>
              ))}
            </>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Available Social Objects</Text>
        {socialObjectSpecs.map((item) => (
          <Text key={item.key} style={styles.bullet}>• {item.label} ({item.key})</Text>
        ))}
      </Card>
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
    marginBottom: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bullet: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
