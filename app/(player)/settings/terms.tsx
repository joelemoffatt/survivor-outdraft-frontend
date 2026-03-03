import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../../constants/theme';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
      <View style={styles.card}>
        <Text style={styles.text}>
          By using Survivor OutDraft, you agree to these terms and conditions.
        </Text>
        <Text style={styles.text}>
          {'\n'}This app is for entertainment purposes only.
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
  text: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: 22,
  },
});
