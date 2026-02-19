import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { isLoggedIn, user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Public routes - only accessible when NOT logged in */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="landing" />
      </Stack.Protected>

      {/* Protected routes - only accessible when logged in */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="index" />
        
        {/* Admin route - nested protection for admin users */}
        <Stack.Protected guard={isAdmin}>
          <Stack.Screen name="admin" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
