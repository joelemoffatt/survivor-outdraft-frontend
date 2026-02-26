import { View, Text, StyleSheet } from 'react-native';

export default function GeneralSettings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>General Settings</Text>
      {/* Add general settings content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
