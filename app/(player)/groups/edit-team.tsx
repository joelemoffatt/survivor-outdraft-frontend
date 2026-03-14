import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function EditTeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Team</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Edit Team page coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.lg,
  },
  placeholder: {
    backgroundColor: Colors.lightBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholderText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
