import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Colors, Spacing } from "../../../constants/theme";

export default function GroupsLayout() {
  const router = useRouter();

  const handleBack = (fallbackRoute: string) => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };

  const renderBackButton = (fallbackRoute: string) => (
    <TouchableOpacity
      onPress={() => handleBack(fallbackRoute)}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{ paddingRight: Spacing.sm }}
    >
      <Ionicons name="chevron-back" size={24} color={Colors.text} />
    </TouchableOpacity>
  );

  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="select"
        options={{
          animation: 'none',
          title: "Select Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          headerLeft: () => renderBackButton("/(player)/group"),
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          animation: 'none',
          title: "Create Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          headerLeft: () => renderBackButton("/(player)/groups/select"),
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          animation: 'none',
          title: "Group Details",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          headerLeft: () => renderBackButton("/(player)/group"),
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          animation: 'none',
          title: "Manage Groups",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          headerLeft: () => renderBackButton("/(player)/group"),
        }}
      />
      <Stack.Screen
        name="manage/[id]"
        options={{
          animation: 'none',
          title: "Edit Group",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          headerLeft: () => renderBackButton("/(player)/groups/manage"),
        }}
      />
      <Stack.Screen
        name="invitations"
        options={{
          animation: 'none',
          title: "Invitations",
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          headerLeft: () => renderBackButton("/(player)/group"),
        }}
      />
    </Stack>
  );
}
