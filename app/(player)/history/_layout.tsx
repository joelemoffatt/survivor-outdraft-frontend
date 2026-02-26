import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingLeft: 16, paddingRight: 8 }}>
    <Text style={{ fontSize: 28, color: "#f4511e", fontWeight: "bold" }}>←</Text>
  </TouchableOpacity>
);

const EmptyBackSpace = () => <View style={{ width: 20 }} />;

export default function HistoryLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Seasons",
          headerBackVisible: false,
          headerLeft: () => <EmptyBackSpace />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="season/[season]/index"
        options={({
          route,
        }: {
          route: { params?: { season?: string } };
        }) => {
          const season = route?.params?.season || "";
          return {
            title: season ? `Season ${season} Episodes` : "Season Episodes",
            headerLeft: () => <BackButton onPress={() => router.push("/history")} />,
            headerTitleAlign: "left",
            headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          };
        }}
      />
      <Stack.Screen
        name="season/[season]/episode/[episode]"
        options={({
          route,
        }: {
          route: { params?: { season?: string; episode?: string } };
        }) => {
          const season = route?.params?.season || "";
          const episode = route?.params?.episode || "";
          let title = "Episode Details";
          if (season && episode) {
            title = `Season ${season} Episode ${episode}`;
          } else if (season) {
            title = `Season ${season} Episode`;
          }
          return {
            title,
            headerLeft: () => <BackButton onPress={() => router.push(`/history/season/${season}`)} />,
            headerTitleAlign: "left",
            headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          };
        }}
      />
    </Stack>
  );
}
