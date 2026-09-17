import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "../../../src/store/authStore";
import { signOut } from "../../../src/lib/auth";
import { getAllTeachers, getAllTasks } from "../../../src/lib/firestore";
import { exportPerformancePdf } from "../../../src/lib/reports";
import { confirmAction, showAlert } from "../../../src/lib/confirm";
import { tapTick, successBuzz } from "../../../src/lib/haptics";
import { GlassCard } from "../../../src/components/GlassCard";
import { colors } from "../../../src/constants/theme";
import { APP_VERSION } from "../../../src/constants/config";

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  bg: string;
  onPress: () => void;
}

export default function AdminSettings() {
  const router = useRouter();
  const appUser = useAuthStore((s) => s.appUser);
  const [exporting, setExporting] = useState(false);

  const go = (href: "/(auth)/(admin)/profile" | "/(auth)/(admin)/teachers" | "/(auth)/(admin)/add-teacher" | "/(auth)/(admin)/notifications") => {
    tapTick();
    router.push(href);
  };

  const handleLogout = async () => {
    const ok = await confirmAction("Logout", "Are you sure you want to logout?", "Logout");
    if (!ok) return;
    await signOut();
    successBuzz();
    router.replace("/login");
  };

  const handleExport = async () => {
    tapTick();
    setExporting(true);
    try {
      const [teachers, tasks] = await Promise.all([getAllTeachers(), getAllTasks()]);
      await exportPerformancePdf(teachers, tasks);
      successBuzz();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const menu: MenuItem[] = [
    {
      icon: "👤",
      title: "My Profile",
      subtitle: "Account details and activity",
      bg: "#EFF6FF",
      onPress: () => go("/(auth)/(admin)/profile"),
    },
    {
      icon: "👥",
      title: "Teachers",
      subtitle: "View, edit or remove teachers",
      bg: "#F0FDF4",
      onPress: () => go("/(auth)/(admin)/teachers"),
    },
    {
      icon: "➕",
      title: "Add Teacher",
      subtitle: "Create a new login account",
      bg: "#FFFBEB",
      onPress: () => go("/(auth)/(admin)/add-teacher"),
    },
    {
      icon: "🔔",
      title: "Notifications",
      subtitle: "Alerts and updates",
      bg: "#FDF2F8",
      onPress: () => go("/(auth)/(admin)/notifications"),
    },
    {
      icon: "📢",
      title: "Broadcast Notice",
      subtitle: "Announce to all teachers",
      bg: "#FFF7ED",
      onPress: () => {
        tapTick();
        router.push("/(auth)/(admin)/broadcast");
      },
    },
    {
      icon: "🛡️",
      title: "Privacy Policy",
      subtitle: "How staff data is handled",
      bg: "#F5F3FF",
      onPress: () => {
        tapTick();
        router.push("/privacy");
      },
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ paddingBottom: 120 }}>
      <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFFFFF" }}>Settings</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          Manage your workspace
        </Text>
        <TouchableOpacity onPress={() => go("/(auth)/(admin)/profile")} activeOpacity={0.8}>
          <GlassCard dark style={{ padding: 16, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
              {appUser?.photoURL ? (
                <Image source={{ uri: appUser.photoURL }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              ) : (
                <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFFFFF" }}>
                  {appUser?.name?.charAt(0)?.toUpperCase() ?? "A"}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF" }}>{appUser?.name ?? "Admin"}</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                {appUser?.employeeId} · Administrator
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>›</Text>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ padding: 16 }}>
        {menu.map((item) => (
          <TouchableOpacity key={item.title} onPress={item.onPress} activeOpacity={0.7}>
            <GlassCard style={{ padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: item.bg, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{item.subtitle}</Text>
              </View>
              <Text style={{ fontSize: 20, color: "#CBD5E1" }}>›</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8, opacity: exporting ? 0.6 : 1 }}
        >
          {exporting ? (
            <ActivityIndicator color="#1A3A6B" />
          ) : (
            <Text style={{ color: "#1A3A6B", fontSize: 15, fontWeight: "800" }}>📄 Export Performance Report (PDF)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: "#FEE2E2", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 }}
        >
          <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "800" }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 20 }}>
          Sri Narayana Teacher Tasks v{APP_VERSION}
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
