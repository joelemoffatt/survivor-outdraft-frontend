import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingLeft: 16, paddingRight: 8 }}>
    <Text style={{ fontSize: 28, color: "#f4511e", fontWeight: "bold" }}>←</Text>
  </TouchableOpacity>
);

export default function HistoryLayout() {
  const router = useRouter();

  const handleBack = (fallbackRoute: string) => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };

  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="index"
        options={{
          animation: 'none',
          title: "Survivor History",
          headerBackVisible: false,
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="seasons"
        options={{
          animation: 'none',
          title: "Seasons",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="episodes"
        options={{
          animation: 'none',
          title: "Episodes",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="castaways"
        options={{
          animation: 'none',
          title: "Castaways",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="tribes"
        options={{
          animation: 'none',
          title: "Tribes",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="challenges"
        options={{
          animation: 'none',
          title: "Challenges",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="tribals"
        options={{
          animation: 'none',
          title: "Tribals",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="votes"
        options={{
          animation: 'none',
          title: "Votes",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="advantages"
        options={{
          animation: 'none',
          title: "Advantages",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="journeys"
        options={{
          animation: 'none',
          title: "Journeys",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="boots"
        options={{
          animation: 'none',
          title: "Boots",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="results"
        options={{
          animation: 'none',
          title: "Results",
          headerLeft: () => <BackButton onPress={() => handleBack("/(player)/more")} />,
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
            animation: 'none',
            title: season ? `Season ${season} Episodes` : "Season Episodes",
            headerLeft: () => <BackButton onPress={() => handleBack("/(player)/history/seasons")} />,
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
            animation: 'none',
            title,
            headerLeft: () => <BackButton onPress={() => handleBack(`/(player)/history/season/${season}`)} />,
            headerTitleAlign: "left",
            headerTitleStyle: { fontSize: 28, fontWeight: "bold" },
          };
        }}
      />
    </Stack>
  );
}
