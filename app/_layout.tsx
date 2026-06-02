import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { GroupProvider } from "../contexts/GroupContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { View } from "react-native";
import AppLoader from "../components/shared/AppLoader";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import useDelayedLoader from "../hooks/useDelayedLoader";

const AUTH_LOADER_DELAY_MS = 200

function RootLayoutNav() {
  const { isLoggedIn, user, isLoading } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const router = useRouter();
  const segments = useSegments();
  const showLoader = useDelayedLoader(isLoading, AUTH_LOADER_DELAY_MS);

  useEffect(() => {
    if (isLoading) return;

    const inPublicGroup = segments[0] === "(public)";
    const inPlayerGroup = segments[0] === "(player)";
    const inSharedGroup = segments[0] === "(shared)";
    const inAdminGroup = segments[0] === "admin";

    if (!isLoggedIn && inPlayerGroup) {
      // Redirect to landing if trying to access player routes while not logged in
      // router.replace("/landing");
      router.replace("/login");
    } else if (!isLoggedIn && inSharedGroup) {
      // Redirect to login if trying to access shared routes while not logged in
      router.replace("/login");
    } else if (!isLoggedIn && inAdminGroup) {
      // Redirect to login if trying to access admin routes while not logged in
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router, segments]);

  if (isLoading && showLoader) {
    return <AppLoader />;
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
      <NotificationProvider>
        <GroupProvider>
          <SafeAreaProvider>
            <RootLayoutNav />
          </SafeAreaProvider>
        </GroupProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
