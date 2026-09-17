import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState } from "react";
import { useRouter } from "expo-router";
import { signOut, updateUserPhoto } from "../../../src/lib/auth";
import { confirmAction, showAlert } from "../../../src/lib/confirm";
import { pickProofPhoto, uploadAvatar } from "../../../src/lib/storage";
import { useAuthStore } from "../../../src/store/authStore";
import { useAdminTasks } from "../../../src/hooks/useTasks";
import { GlassCard } from "../../../src/components/GlassCard";
import { colors } from "../../../src/constants/theme";

export default function AdminProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const appUser = useAuthStore((s) => s.appUser);
  const setUser = useAuthStore((s) => s.setUser);
  const { tasks } = useAdminTasks();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleLogout = async () => {
    const ok = await confirmAction("Logout", "Are you sure you want to logout?", "Logout");
    if (!ok) return;
    await signOut();
    router.replace("/login");
  };

  const handleChangePhoto = async () => {
    if (!appUser) return;
    setUploadingPhoto(true);
    try {
      const photo = await pickProofPhoto();
      if (!photo) return;
      const url = await uploadAvatar(appUser.uid, photo);
      await updateUserPhoto(appUser.uid, url);
      setUser(user, { ...appUser, photoURL: url });
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to update photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ paddingBottom: 100 }}>
      <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: "center" }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 8, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
          {appUser?.photoURL ? (
            <Image source={{ uri: appUser.photoURL }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Text style={{ fontSize: 36 }}>{appUser?.name?.charAt(0)?.toUpperCase() ?? "A"}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto} style={{ marginBottom: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
          {uploadingPhoto ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)" }}>
              {appUser?.photoURL ? "Change Photo" : "Add Photo"}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFFFFF" }}>{appUser?.name}</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "500", marginTop: 4 }}>
          {appUser?.employeeId} · Administrator
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ padding: 16, marginTop: -36 }}>
        <GlassCard style={{ padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 16 }}>System Overview</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary[500] }}>{total}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748B" }}>Total Tasks</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#22C55E" }}>{completed}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748B" }}>Completed</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary[500] }}>{rate}%</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#64748B" }}>Completion</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={{ padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 16 }}>Account</Text>
          <View style={{ gap: 12 }}>
            <ProfileRow label="Employee ID" value={appUser?.employeeId ?? ""} />
            <ProfileRow label="Role" value="Administrator" />
            <ProfileRow label="Email" value={appUser?.email ?? ""} />
          </View>
        </GlassCard>

        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: "#FEE2E2", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 }}
        >
          <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "800" }}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
      <Text style={{ fontSize: 14, color: "#64748B", fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }}>{value}</Text>
    </View>
  );
}
