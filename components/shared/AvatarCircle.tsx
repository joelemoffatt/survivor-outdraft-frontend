import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Colors, FontSizes } from "../../constants/theme";

type AvatarCircleProps = {
  source?: ImageSourcePropType | null;
  uri?: string | null;
  fallbackText?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const getFallbackInitial = (value?: string) => {
  if (value?.startsWith("Team ")) {
    return value.charAt(5).toUpperCase();
  }
  const trimmed = value?.trim();
  if (!trimmed) {
    return "?";
  }

  return trimmed.charAt(0).toUpperCase();
};

export default function AvatarCircle({
  source,
  uri,
  fallbackText,
  size = 40,
  style,
}: AvatarCircleProps) {
  const resolvedSource = source ?? (uri ? { uri } : null);
  const initial = getFallbackInitial(fallbackText);
  const borderRadius = size / 2;
  const fallbackFontSize = Math.max(FontSizes.small, Math.round(size * 0.42));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      {resolvedSource ? (
        <Image
          source={resolvedSource}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.fallbackText, { fontSize: fallbackFontSize }]}>
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    color: Colors.background,
    fontWeight: "700",
  },
});
