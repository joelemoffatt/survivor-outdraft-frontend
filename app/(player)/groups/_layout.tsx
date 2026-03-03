import { Stack } from "expo-router";

export default function GroupsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="select"
        options={{
          title: "Select Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Create Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Group Details",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="invitations"
        options={{
          title: "Invitations",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
    </Stack>
  );
}
