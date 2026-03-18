import { Stack } from 'expo-router';
import BackButton from '../../../components/shared/BackButton';

const commonOptions = {
  animation: 'none' as const,
  headerTitleAlign: 'left' as const,
  headerTitleStyle: { fontSize: 28, fontWeight: 'bold' as const },
  headerLeft: () => <BackButton fallbackRoute="/more" />,
};

export default function SettingsLayout() {

  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="notifications"
        options={{
          ...commonOptions,
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="preferences"
        options={{
          ...commonOptions,
          title: 'App Preferences',
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          ...commonOptions,
          title: 'Terms of Service',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          ...commonOptions,
          title: 'About This App',
        }}
      />
    </Stack>
  );
}