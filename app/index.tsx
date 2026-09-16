import { useEffect, useRef } from "react";
import { View, Text, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { colors } from "../src/constants/theme";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 8, stiffness: 100, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(progressWidth, { toValue: 1, duration: 1200, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/(auth)");
        } else {
          router.replace("/login");
        }
      }, 2000);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary[500], justifyContent: "center", alignItems: "center" }}>
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: "rgba(255,255,255,0.15)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Text style={{ fontSize: 48 }}>{"\uD83C\uDF93"}</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 }}>
          Sri Narayana
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          Teacher Tasks
        </Text>
      </Animated.View>

      <Animated.Text
        style={{
          opacity: taglineOpacity,
          position: "absolute",
          bottom: 120,
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
          fontWeight: "500",
        }}
      >
        Empowering Educators
      </Animated.Text>

      <View
        style={{
          position: "absolute",
          bottom: 80,
          width: width * 0.3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: "rgba(255,255,255,0.15)",
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 1.5,
            backgroundColor: "#FFFFFF",
            width: progressWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </View>
  );
}
