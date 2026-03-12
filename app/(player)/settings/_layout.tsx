import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../../../constants/theme';

export default function SettingsLayout() {
  const router = useRouter();

  const handleBack = (fallbackRoute: string) => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };

  const commonOptions = {
    animation: 'none' as const,
    headerTitleAlign: 'left' as const,
    headerTitleStyle: { fontSize: 28, fontWeight: 'bold' as const },
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => handleBack('/(player)/more')}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ paddingRight: Spacing.sm }}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
      </TouchableOpacity>
    ),
  };

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