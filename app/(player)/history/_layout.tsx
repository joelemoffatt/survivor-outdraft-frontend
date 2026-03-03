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
          title: "Survivor History",
          headerBackVisible: false,
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="seasons"
        options={{
          title: "Seasons",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="episodes"
        options={{
          title: "Episodes",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="castaways"
        options={{
          title: "Castaways",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="tribes"
        options={{
          title: "Tribes",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="challenges"
        options={{
          title: "Challenges",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="tribals"
        options={{
          title: "Tribals",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="votes"
        options={{
          title: "Votes",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="advantages"
        options={{
          title: "Advantages",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="journeys"
        options={{
          title: "Journeys",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="boots"
        options={{
          title: "Boots",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="results"
        options={{
          title: "Results",
          headerLeft: () => <BackButton onPress={() => router.push("/(player)/more")} />,
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
            headerLeft: () => <BackButton onPress={() => router.push("/(player)/history/seasons")} />,
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
            headerLeft: () => <BackButton onPress={() => router.push(`/(player)/history/season/${season}`)} />,
            headerTitleAlign: "left",
            headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          };
        }}
      />
    </Stack>
  );
}
