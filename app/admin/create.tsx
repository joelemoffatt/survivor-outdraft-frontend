import { useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import GenericCrudFormPage from '../../components/admin/GenericCrudFormPage';
import { socialCrudConfigMap, SocialResourceKey } from '../../components/admin/resourceConfigs';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

export default function AdminCreateScreen() {
  const params = useLocalSearchParams<{ resource?: string; id?: string; backPath?: string }>();
  const resource = params.resource as SocialResourceKey | undefined;
  const recordId = typeof params.id === 'string' ? params.id : undefined;
  const backPath = typeof params.backPath === 'string' ? params.backPath : '/admin/social';
  const config = resource ? socialCrudConfigMap[resource] : undefined;

  if (config) {
    return <GenericCrudFormPage config={config} id={recordId} backPath={backPath} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unsupported Resource</Text>
      <Text style={styles.subtitle}>Use this route with a valid resource parameter.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.adminBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
