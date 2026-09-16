import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";
import "../src/global.css";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsub = initialize();
    return () => unsub();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
