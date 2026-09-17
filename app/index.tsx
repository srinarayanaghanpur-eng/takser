import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

const { width } = Dimensions.get("window");

const STATUS_MESSAGES = [
  "Preparing Dashboard...",
  "Loading Tasks...",
  "Checking Deadlines...",
  "Almost Ready...",
];

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [statusIndex, setStatusIndex] = useState(0);

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const copySlide = useRef(new Animated.Value(12)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 9, stiffness: 110, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(copyOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(copySlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(progressWidth, { toValue: 1, duration: 1400, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    const timers = STATUS_MESSAGES.map((_, i) =>
      setTimeout(() => setStatusIndex(i), 400 + i * 550)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/(auth)");
        } else {
          router.replace("/login");
        }
      }, 2600);
      return () => clearTimeout(t);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F7FAFF", justifyContent: "center", alignItems: "center" }}>
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(59,130,246,0.15)",
            shadowColor: "#1D4ED8",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.22,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <Image
            source={require("../assets/splash-icon.png")}
            style={{ width: 100, height: 100, borderRadius: 22 }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: copyOpacity,
          transform: [{ translateY: copySlide }],
          alignItems: "center",
          marginTop: 28,
        }}
      >
        <Text style={{ fontSize: 27, fontWeight: "800", color: "#173B8E", letterSpacing: -0.8 }}>
          Sri Narayana Teacher Tasks
        </Text>
        <Text style={{ fontSize: 10, fontWeight: "800", color: "#3B82F6", letterSpacing: 3, marginTop: 10 }}>
          EMPOWERING EDUCATORS
        </Text>
      </Animated.View>

      <View style={{ position: "absolute", bottom: 90, alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: "#6B86B8", fontWeight: "500", marginBottom: 14 }}>
          {STATUS_MESSAGES[statusIndex]}
        </Text>
        <View
          style={{
            width: width * 0.5,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(59,130,246,0.13)",
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              borderRadius: 2,
              backgroundColor: "#1D4ED8",
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ["8%", "100%"],
              }),
            }}
          />
        </View>
        <Text style={{ marginTop: 14, color: "rgba(107,134,184,0.7)", fontSize: 9, fontWeight: "700", letterSpacing: 0.8 }}>
          SECURE • CONNECTED
        </Text>
      </View>
    </View>
  );
}
