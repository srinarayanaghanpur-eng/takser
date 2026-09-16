import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const appUser = useAuthStore((s) => s.appUser);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#1A3A6B" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const role = appUser?.role;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {role === "admin" ? (
        <Stack.Screen name="(admin)" options={{ animation: "fade" }} />
      ) : (
        <Stack.Screen name="(teacher)" options={{ animation: "fade" }} />
      )}
    </Stack>
  );
}
