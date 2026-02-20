import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

function RootLayoutNav() {
  const { isLoggedIn, user, isLoading } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  // Wait for auth to load before rendering routes with guards
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Public group - only accessible when NOT logged in */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>

      {/* Player group - only accessible when logged in */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(player)" />
        
        {/* Admin route - only accessible when logged in AND isAdmin */}
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
