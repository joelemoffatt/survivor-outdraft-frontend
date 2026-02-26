import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="general" options={{ title: 'General Settings' }} />
      <Stack.Screen name="groups" options={{ title: 'Groups Settings' }} />
    </Stack>
  );
}
