import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { loginWithEmployeeId } from "../src/lib/auth";
import { updateUserPushToken } from "../src/lib/firestore";
import { registerForPushNotifications } from "../src/lib/notifications";
import { successBuzz, errorBuzz } from "../src/lib/haptics";
import { colors } from "../src/constants/theme";
import { useAuthStore } from "../src/store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!employeeId.trim() || !password.trim()) {
      setError("Please enter Employee ID and Password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { user, appUser } = await loginWithEmployeeId(employeeId.trim(), password);
      setUser(user, appUser);
      successBuzz();
      registerForPushNotifications()
        .then((token) => {
          if (token) return updateUserPushToken(user.uid, token);
        })
        .catch(() => {});
      router.replace("/(auth)");
    } catch (e) {
      errorBuzz();
      setError(e instanceof Error ? e.message : "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F7FAFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View pointerEvents="none" style={{ position: "absolute", top: -90, right: -90, width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(96,165,250,0.14)" }} />
      <View pointerEvents="none" style={{ position: "absolute", bottom: -70, left: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(59,130,246,0.10)" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: "center", marginBottom: 36 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.7)",
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.12)",
              marginBottom: 20,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#3B82F6" }} />
            <Text style={{ fontSize: 9, fontWeight: "800", color: "#6B86B8", letterSpacing: 1.4 }}>
              SRI NARAYANA TEACHER TASKS
            </Text>
          </View>
          <View
            style={{
              width: 116,
              height: 116,
              borderRadius: 58,
              backgroundColor: "#FFFFFF",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.2)",
              shadowColor: "#1D4ED8",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.22,
              shadowRadius: 22,
              elevation: 8,
            }}
          >
            <Image
              source={require("../assets/splash-icon.png")}
              style={{ width: 84, height: 84, borderRadius: 18 }}
              resizeMode="contain"
            />
          </View>
          <Text style={{ fontSize: 27, fontWeight: "800", color: "#173B8E", letterSpacing: -0.5, marginBottom: 4 }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 15, color: "#6B86B8", fontWeight: "500" }}>
            Sign in to your account
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(600).delay(150)}
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: "rgba(59,130,246,0.12)",
            shadowColor: "#1D4ED8",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 30,
            elevation: 8,
          }}
        >
          {error ? (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                {error}
              </Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Employee ID
          </Text>
          <TextInput
            value={employeeId}
            onChangeText={setEmployeeId}
            placeholder="Enter your employee ID"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 14,
              padding: 16,
              fontSize: 16,
              fontWeight: "600",
              color: "#0F172A",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          />

          <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 14,
              padding: 16,
              fontSize: 16,
              fontWeight: "600",
              color: "#0F172A",
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: "#1D4ED8",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
              shadowColor: "#1D4ED8",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Sign In</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/privacy")} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
