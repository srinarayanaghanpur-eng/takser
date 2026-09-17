import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { loginWithEmployeeId } from "../src/lib/auth";
import { updateUserPushToken } from "../src/lib/firestore";
import { registerForPushNotifications } from "../src/lib/notifications";
import {
  authenticateForQuickLogin,
  saveLoginCredential,
  getSavedCredential,
  clearSavedCredential,
} from "../src/lib/biometric";
import { successBuzz, errorBuzz, tapTick, mediumThud } from "../src/lib/haptics";
import { useAuthStore } from "../src/store/authStore";
import { APP_VERSION } from "../src/constants/config";

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"id" | "pw" | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shakeX = useSharedValue(0);
  const cardShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-7, { duration: 55 }),
      withTiming(4, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  };

  useEffect(() => {
    getSavedCredential().then((saved) => {
      if (saved) {
        setEmployeeId(saved.employeeId);
        setHasSaved(true);
      }
    });
  }, []);

  const doLogin = async (id: string, pw: string, remember: boolean) => {
    setLoading(true);
    setError("");
    try {
      const { user, appUser } = await loginWithEmployeeId(id.trim(), pw);
      setUser(user, appUser);
      successBuzz();
      if (remember) {
        await saveLoginCredential(id.trim(), pw);
      } else {
        await clearSavedCredential();
      }
      registerForPushNotifications()
        .then((token) => {
          if (token) return updateUserPushToken(user.uid, token);
        })
        .catch(() => {});
      router.replace("/(auth)");
    } catch (e) {
      errorBuzz();
      shake();
      setError(e instanceof Error ? e.message : "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!employeeId.trim() || !password.trim()) {
      shake();
      setError("Please enter Employee ID and Password");
      return;
    }
    doLogin(employeeId, password, rememberMe);
  };

  const handleQuickLogin = async () => {
    const saved = await getSavedCredential();
    if (!saved) return;
    mediumThud();
    const ok = await authenticateForQuickLogin();
    if (!ok) return;
    setQuickLoading(true);
    try {
      await doLogin(saved.employeeId, saved.password, true);
    } finally {
      setQuickLoading(false);
    }
  };

  const inputWrap = (active: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: active ? 2 : 1,
    borderColor: active ? "#3B82F6" : "#E2E8F0",
    paddingHorizontal: 12,
    marginBottom: 14,
    shadowColor: active ? "#3B82F6" : "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: active ? 0.18 : 0,
    shadowRadius: 8,
    elevation: active ? 3 : 0,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F7FAFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View pointerEvents="none" style={{ position: "absolute", top: -90, right: -90, width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(96,165,250,0.14)" }} />
      <View pointerEvents="none" style={{ position: "absolute", bottom: -70, left: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(59,130,246,0.10)" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: "center", marginBottom: 32 }}>
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
          style={[
            {
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
            },
            cardShakeStyle,
          ]}
        >
          {error ? (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#FECACA",
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
          <View style={inputWrap(focused === "id")}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
            <TextInput
              value={employeeId}
              onChangeText={setEmployeeId}
              onFocus={() => setFocused("id")}
              onBlur={() => setFocused(null)}
              placeholder="e.g. sabha"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: "600", color: "#0F172A" }}
            />
          </View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Password
          </Text>
          <View style={inputWrap(focused === "pw")}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Text style={{ fontSize: 16 }}>🔒</Text>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused(null)}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              onSubmitEditing={handleLogin}
              style={{ flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: "600", color: "#0F172A" }}
            />
            <TouchableOpacity
              onPress={() => { tapTick(); setShowPassword((v) => !v); }}
              style={{ padding: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => { tapTick(); setRememberMe((v) => !v); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 2 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                backgroundColor: rememberMe ? "#1D4ED8" : "#FFFFFF",
                borderWidth: rememberMe ? 0 : 2,
                borderColor: "#CBD5E1",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {rememberMe && <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
              Remember me on this device
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
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
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Sign In →</Text>
            )}
          </TouchableOpacity>

          {hasSaved && !loading ? (
            <TouchableOpacity
              onPress={handleQuickLogin}
              disabled={quickLoading}
              style={{
                marginTop: 12,
                backgroundColor: "#EFF6FF",
                borderWidth: 1,
                borderColor: "#BFDBFE",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                opacity: quickLoading ? 0.6 : 1,
              }}
            >
              {quickLoading ? (
                <ActivityIndicator color="#1A3A6B" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 18 }}>🆔</Text>
                  <Text style={{ color: "#1A3A6B", fontSize: 15, fontWeight: "800" }}>
                    Quick Login with Biometrics
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity onPress={() => router.push("/privacy")} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 20, fontWeight: "600", letterSpacing: 0.5 }}>
          v{APP_VERSION} · SECURE · ENCRYPTED
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
