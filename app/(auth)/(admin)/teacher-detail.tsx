import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { fetchAppUser, updateTeacherProfile, resetTeacherPassword, deleteTeacherAccount } from "../../../src/lib/auth";
import { confirmAction, showAlert } from "../../../src/lib/confirm";
import { successBuzz, tapTick } from "../../../src/lib/haptics";
import { GlassCard } from "../../../src/components/GlassCard";
import { LoadingState } from "../../../src/components/LoadingState";
import { ErrorState } from "../../../src/components/ErrorState";
import { colors } from "../../../src/constants/theme";
import type { AppUser } from "../../../src/types";

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

export default function TeacherDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchAppUser(id as string);
      setTeacher(data);
      setName(data.name);
      setDepartment(data.department ?? "");
      setIsClassTeacher(!!data.isClassTeacher);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load teacher");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!teacher) return;
    setSaving(true);
    try {
      await updateTeacherProfile(teacher.uid, { name, department, isClassTeacher });
      successBuzz();
      showAlert("Saved", "Teacher profile updated");
      load();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!teacher) return;
    if (!newPassword || newPassword.length < 6) {
      showAlert("Required", "New password must be at least 6 characters");
      return;
    }
    const ok = await confirmAction(
      "Reset Password",
      `Set a new password for ${teacher.name}?`,
      "Reset"
    );
    if (!ok) return;
    setResetting(true);
    try {
      await resetTeacherPassword(
        teacher.email,
        teacher.initialPassword ?? "",
        newPassword
      );
      successBuzz();
      showAlert("Done", "Password updated. Share the new password with the teacher.");
      setNewPassword("");
      load();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Password reset failed");
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!teacher) return;
    const ok = await confirmAction(
      "Remove Teacher",
      `${teacher.name} will immediately lose app access. Their past tasks stay in history. Continue?`,
      "Remove"
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteTeacherAccount(teacher.uid);
      successBuzz();
      router.back();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to remove teacher");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading teacher..." />;
  if (error || !teacher) return <ErrorState message={error ?? "Teacher not found"} onRetry={load} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: teacher.name, headerTintColor: colors.primary[500] }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={{ padding: 20, marginBottom: 16, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary[500], justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFFFFF" }}>
                {teacher.name?.charAt(0)?.toUpperCase() ?? "T"}
              </Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A" }}>{teacher.name}</Text>
            <Text style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
              ID: {teacher.employeeId} · {teacher.department ?? "General"}
            </Text>
            <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>{teacher.email}</Text>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80)}>
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 16 }}>Edit Profile</Text>
            <FieldLabel>Full Name</FieldLabel>
            <TextInput value={name} onChangeText={setName} placeholder="Teacher name" placeholderTextColor="#94A3B8" style={inputStyle} />
            <FieldLabel>Subject / Department</FieldLabel>
            <TextInput value={department} onChangeText={setDepartment} placeholder="e.g. Mathematics" placeholderTextColor="#94A3B8" style={inputStyle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Class Teacher</Text>
              <Switch
                value={isClassTeacher}
                onValueChange={(v) => { tapTick(); setIsClassTeacher(v); }}
                trackColor={{ false: "#E2E8F0", true: colors.primary[500] }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: colors.primary[500], borderRadius: 14, padding: 14, alignItems: "center", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>Save Changes</Text>}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(140)}>
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 6 }}>Login & Password</Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
              Login ID: <Text style={{ fontWeight: "800", color: "#0F172A" }}>{teacher.employeeId}</Text>
              {teacher.initialPassword ? (
                <Text> · Current password: <Text style={{ fontWeight: "800", color: "#0F172A" }}>{teacher.initialPassword}</Text></Text>
              ) : null}
            </Text>
            <FieldLabel>Set New Password</FieldLabel>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={inputStyle}
            />
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={resetting}
              style={{ backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 14, padding: 14, alignItems: "center", opacity: resetting ? 0.6 : 1 }}
            >
              {resetting ? <ActivityIndicator color="#92400E" /> : <Text style={{ color: "#92400E", fontSize: 15, fontWeight: "800" }}>Reset Password</Text>}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={{ backgroundColor: "#FEE2E2", borderRadius: 14, padding: 16, alignItems: "center", opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? <ActivityIndicator color="#DC2626" /> : <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "800" }}>Remove Teacher</Text>}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
