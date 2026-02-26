import { View, Text, StyleSheet } from 'react-native';

export default function GroupsSettings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups Settings</Text>
      {/* Add groups settings content here */}
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
