import { Stack } from "expo-router";
import BackButton from "../../../components/shared/BackButton";

const HEADER_BASE = {
  animation: 'none' as const,
  headerTitleAlign: 'left' as const,
  headerTitleStyle: { fontSize: 28, fontWeight: 'bold' as const },
};

export default function GroupsLayout() {
  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="select"
        options={{ ...HEADER_BASE, title: "Select Group", headerLeft: () => <BackButton fallbackRoute="/(player)/group" /> }}
      />
      <Stack.Screen
        name="create"
        options={{ ...HEADER_BASE, title: "Create Group", headerLeft: () => <BackButton fallbackRoute="/(player)/groups/select" /> }}
      />
      <Stack.Screen
        name="details"
        options={{ ...HEADER_BASE, title: "Group Details", headerLeft: () => <BackButton fallbackRoute="/(player)/group" /> }}
      />
      <Stack.Screen
        name="edit-team"
        options={{ ...HEADER_BASE, title: "Edit Team", headerLeft: () => <BackButton fallbackRoute="/(player)/team" /> }}
      />
      <Stack.Screen
        name="manage"
        options={{ ...HEADER_BASE, title: "Manage Groups", headerLeft: () => <BackButton fallbackRoute="/(player)/group" /> }}
      />
      <Stack.Screen
        name="manage/[id]"
        options={{ ...HEADER_BASE, title: "Edit Group", headerLeft: () => <BackButton fallbackRoute="/(player)/groups/manage" /> }}
      />
      <Stack.Screen
        name="invitations"
        options={{ ...HEADER_BASE, title: "Invitations", headerLeft: () => <BackButton fallbackRoute="/(player)/group" /> }}
      />
    </Stack>
  );
}
