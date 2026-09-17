import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
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
      style={{ flex: 1, backgroundColor: colors.primary[500] }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Text style={{ fontSize: 36 }}>{"🎓"}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
            Sign in to your account
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(600).delay(150)}
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 30,
            elevation: 10,
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
              backgroundColor: colors.primary[500],
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
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
