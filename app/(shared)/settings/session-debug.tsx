import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  FontSizes,
  Spacing,
} from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useGroup } from "../../../contexts/GroupContext";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AboutScreen() {
  const {
    user,
    isLoggedIn,
    token,
    isLoading: authLoading,
    isAdminView,
  } = useAuth();
  const [sessionDebug, setSessionDebug] = useState({
    nowIso: "",
    storedTokenPresent: false,
    storedUserPresent: false,
    storedAdminViewValue: "",
    storedSessionStartedAt: "",
    sessionAgeSeconds: "",
  });

  useEffect(() => {
    const readSessionDebug = async () => {
      try {
        const [storedToken, storedUser, storedAdminView, storedSessionStartedAt] =
          await Promise.all([
            AsyncStorage.getItem("auth_token"),
            AsyncStorage.getItem("auth_user"),
            AsyncStorage.getItem("admin_view_enabled"),
            AsyncStorage.getItem("session_started_at"),
          ]);

        const now = new Date();
        const startedAtMs = storedSessionStartedAt ? Number(storedSessionStartedAt) : NaN;
        const ageSeconds = Number.isFinite(startedAtMs)
          ? Math.max(Math.floor((now.getTime() - startedAtMs) / 1000), 0)
          : null;

        setSessionDebug({
          nowIso: now.toISOString(),
          storedTokenPresent: Boolean(storedToken),
          storedUserPresent: Boolean(storedUser),
          storedAdminViewValue: storedAdminView ?? "null",
          storedSessionStartedAt: storedSessionStartedAt ?? "null",
          sessionAgeSeconds: ageSeconds == null ? "n/a" : String(ageSeconds),
        });
      } catch (storageError) {
        setSessionDebug((previous) => ({
          ...previous,
          nowIso: new Date().toISOString(),
          sessionAgeSeconds: "error",
        }));
      }
    };

    readSessionDebug();
    const interval = setInterval(readSessionDebug, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isLoggedIn, token, user?.id, isAdminView]);

  const { selectedGroupId, groupsLoaded, userHasGroups } = useGroup();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        Session Debug for Survivor OutDraft Developers
      </Text>
      <View style={styles.sessionCard}>
        <Text style={styles.sessionTitle}>Session Debug (Testing)</Text>
        <Text style={styles.sessionLine}>isLoggedIn: {String(isLoggedIn)}</Text>
        <Text style={styles.sessionLine}>
          authLoading: {String(authLoading)}
        </Text>
        <Text style={styles.sessionLine}>
          isAdminView: {String(isAdminView)}
        </Text>
        <Text style={styles.sessionLine}>userId: {user?.id ?? "null"}</Text>
        <Text style={styles.sessionLine}>
          username: {user?.username ?? "null"}
        </Text>
        <Text style={styles.sessionLine}>
          tokenPresent: {String(Boolean(token))}
        </Text>
        <Text style={styles.sessionLine}>
          selectedGroupId: {selectedGroupId ?? "null"}
        </Text>
        <Text style={styles.sessionLine}>
          groupsLoaded: {String(groupsLoaded)}
        </Text>
        <Text style={styles.sessionLine}>
          userHasGroups: {String(userHasGroups)}
        </Text>
        <Text style={styles.sessionLine}>
          storedTokenPresent: {String(sessionDebug.storedTokenPresent)}
        </Text>
        <Text style={styles.sessionLine}>
          storedUserPresent: {String(sessionDebug.storedUserPresent)}
        </Text>
        <Text style={styles.sessionLine}>
          storedAdminView: {sessionDebug.storedAdminViewValue}
        </Text>
        <Text style={styles.sessionLine}>
          sessionStartedAt: {sessionDebug.storedSessionStartedAt}
        </Text>
        <Text style={styles.sessionLine}>
          sessionAgeSeconds: {sessionDebug.sessionAgeSeconds}
        </Text>
        <Text style={styles.sessionLine}>
          now: {sessionDebug.nowIso || "n/a"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxlarge,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: 22,
  },
  sessionCard: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sessionTitle: {
    color: Colors.text,
    fontSize: FontSizes.medium,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  sessionLine: {
    color: Colors.textSecondary,
    fontSize: FontSizes.small,
    lineHeight: 18,
  },
});
