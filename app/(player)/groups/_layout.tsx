import { Stack } from "expo-router";

export default function GroupsLayout() {
  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="select"
        options={{
          animation: 'none',
          title: "Select Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          animation: 'none',
          title: "Create Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          animation: 'none',
          title: "Group Details",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="invitations"
        options={{
          animation: 'none',
          title: "Invitations",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
    </Stack>
  );
}
