import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import Button from './Button';

export default function CreateOrJoinGroup() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Groups Yet</Text>
      <Text style={styles.subtitle}>Create a group to start your fantasy draft, or join one from a friend.</Text>
      <Button
        label="Create Group"
        variant="primary"
        size="md"
        onPress={() => router.push('/(player)/groups/create')}
        style={styles.button}
      />
      <Button
        label="Join Group"
        variant="outline"
        size="md"
        onPress={() => {}}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  button: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
});
