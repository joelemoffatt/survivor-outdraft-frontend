import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { GroupProvider } from "../contexts/GroupContext";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

function RootLayoutNav() {
  const { isLoggedIn, user, isLoading } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inPublicGroup = segments[0] === "(public)";
    const inPlayerGroup = segments[0] === "(player)";
    const inAdminGroup = segments[0] === "admin";

    if (!isLoggedIn && inPlayerGroup) {
      // Redirect to landing if trying to access player routes while not logged in
      // router.replace("/landing");
      router.replace("/login");
    } else if (!isLoggedIn && inAdminGroup) {
      // Redirect to login if trying to access admin routes while not logged in
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router, segments]);

  // Wait for auth to load before rendering
  // TODO: Add a delay before showing the loader to prevent flickering on fast loads
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false, 
      animation: 'none',
      gestureEnabled: false,
    }}>
      <Stack.Screen name="(public)" options={{ animation: 'none' }} />
      <Stack.Screen name="(player)" options={{ animation: 'none' }} />
      <Stack.Screen name="(shared)" options={{ animation: 'none' }} />
      <Stack.Screen name="admin" options={{ animation: 'none' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GroupProvider>
        <SafeAreaProvider>
          <RootLayoutNav />
        </SafeAreaProvider>
      </GroupProvider>
    </AuthProvider>
  );
}
