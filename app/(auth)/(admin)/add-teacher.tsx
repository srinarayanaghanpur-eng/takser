import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState } from "react";
import { useRouter, Stack } from "expo-router";
import { createTeacherAccount } from "../../../src/lib/auth";
import { showAlert } from "../../../src/lib/confirm";
import { successBuzz, tapTick } from "../../../src/lib/haptics";
import { GlassCard } from "../../../src/components/GlassCard";
import { colors } from "../../../src/constants/theme";

function FieldLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: "#F8FAFC",
  borderRadius: 14,
  padding: 16,
  fontSize: 16,
  fontWeight: "600" as const,
  color: "#0F172A",
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#E2E8F0",
};

export default function AddTeacherScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert("Required", "Please enter the teacher's name");
      return;
    }
    if (!employeeId.trim()) {
      showAlert("Required", "Please enter an employee ID for login");
      return;
    }
    if (!password || password.length < 6) {
      showAlert("Required", "Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await createTeacherAccount({
        employeeId: employeeId.trim(),
        password,
        name: name.trim(),
        department: department.trim() || "General",
        isClassTeacher,
      });
      successBuzz();
      showAlert(
        "Teacher Added",
        `${name.trim()} can now log in with ID "${employeeId.trim().toLowerCase()}"`
      );
      router.back();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to create teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "Add Teacher", headerTintColor: colors.primary[500] }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <FieldLabel>Full Name</FieldLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor="#94A3B8"
              style={inputStyle}
            />

            <FieldLabel>Employee ID (login ID)</FieldLabel>
            <TextInput
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="e.g. tch004"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
            <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: -12, marginBottom: 16 }}>
              Teacher will log in with this ID (lowercase).
            </Text>

            <FieldLabel>Password</FieldLabel>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={inputStyle}
            />

            <FieldLabel>Subject / Department</FieldLabel>
            <TextInput
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#94A3B8"
              style={inputStyle}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Class Teacher</Text>
                <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  Can receive class-wide tasks
                </Text>
              </View>
              <Switch
                value={isClassTeacher}
                onValueChange={(v) => { tapTick(); setIsClassTeacher(v); }}
                trackColor={{ false: "#E2E8F0", true: colors.primary[500] }}
              />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(100)}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: colors.primary[500],
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Create Teacher Account</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
