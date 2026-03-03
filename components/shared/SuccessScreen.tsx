import React, { useEffect, useRef } from "react";
import { Animated, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../constants/theme";

interface SuccessScreenProps {
  title: string;
  subtitle?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function SuccessScreen({ 
  title, 
  subtitle, 
  onComplete,
  duration = 1200 
}: SuccessScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, onComplete, duration]);

  return (
    <SafeAreaView style={styles.successSafeArea}>
      <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={64} color="#fff" />
        </View>
        <Text style={styles.successTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.successSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  successSafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
