import { Stack } from 'expo-router';
import { useSegments, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

function TopSegmentBar() {
  const segments = useSegments();
  const router = useRouter();
  const currentScreen = segments[segments.length - 1] || 'index';

  const tabs = [
    { name: 'index', label: 'Dashboard' },
    { name: 'history', label: 'History' },
  ];

  return (
    <View style={styles.segmentContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.segment,
            currentScreen === tab.name && styles.segmentActive,
          ]}
          onPress={() => router.push(`/(player)/${tab.name === 'index' ? '' : tab.name}`)}
        >
          <Text
            style={[
              styles.segmentText,
              currentScreen === tab.name && styles.segmentTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PlayerLayout() {
  return (
    <>
      <TopSegmentBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="history" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  segmentActive: {
    borderBottomColor: '#f4511e',
  },
  segmentText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#f4511e',
    fontWeight: 'bold',
  },
});
