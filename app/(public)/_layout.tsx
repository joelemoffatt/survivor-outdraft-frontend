import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function PublicLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack screenOptions={{ 
        headerShown: false, 
        animation: 'none',
        gestureEnabled: false,
      }} initialRouteName="login">
      <Stack.Screen name="landing" options={{ animation: 'none' }} />
      <Stack.Screen name="login" options={{ animation: 'none' }} />
      <Stack.Screen name="signup" options={{ animation: 'none' }} />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
