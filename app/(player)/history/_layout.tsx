import { Stack } from "expo-router";
import BackButton from "../../../components/shared/BackButton";

const HEADER_BASE = {
  animation: 'none' as const,
  headerTitleAlign: 'left' as const,
  headerTitleStyle: { fontSize: 28, fontWeight: 'bold' as const },
};

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name="index"
        options={{ ...HEADER_BASE, title: "Survivor History", headerBackVisible: false, headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="seasons"
        options={{ ...HEADER_BASE, title: "Seasons", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="episodes"
        options={{ ...HEADER_BASE, title: "Episodes", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="castaways"
        options={{ ...HEADER_BASE, title: "Castaways", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="castaways/[id]"
        options={{ ...HEADER_BASE, title: "Castaway Details", headerLeft: () => <BackButton fallbackRoute="/(player)/history/castaways" /> }}
      />
      <Stack.Screen
        name="tribes"
        options={{ ...HEADER_BASE, title: "Tribes", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="tribes/[id]"
        options={{ ...HEADER_BASE, title: "Tribe Details", headerLeft: () => <BackButton fallbackRoute="/(player)/history/tribes" /> }}
      />
      <Stack.Screen
        name="challenges"
        options={{ ...HEADER_BASE, title: "Challenges", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="tribals"
        options={{ ...HEADER_BASE, title: "Tribals", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="votes"
        options={{ ...HEADER_BASE, title: "Votes", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="advantages"
        options={{ ...HEADER_BASE, title: "Advantages", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="journeys"
        options={{ ...HEADER_BASE, title: "Journeys", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="boots"
        options={{ ...HEADER_BASE, title: "Boots", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
      />
      <Stack.Screen
        name="results"
        options={{ ...HEADER_BASE, title: "Results", headerLeft: () => <BackButton fallbackRoute="/more" /> }}
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
            ...HEADER_BASE,
            title: season ? `Season ${season} Episodes` : "Season Episodes",
            headerLeft: () => <BackButton fallbackRoute="/(player)/history/seasons" />,
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
          if (season && episode) title = `Season ${season} Episode ${episode}`;
          else if (season) title = `Season ${season} Episode`;
          return {
            ...HEADER_BASE,
            title,
            headerLeft: () => <BackButton fallbackRoute={`/(player)/history/season/${season}`} />,
          };
        }}
      />
    </Stack>
  );
}
