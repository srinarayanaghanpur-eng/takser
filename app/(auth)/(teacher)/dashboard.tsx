import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/store/authStore";
import { useTeacherTasks } from "../../../src/hooks/useTasks";
import { TaskCard } from "../../../src/components/TaskCard";
import { StatCard } from "../../../src/components/StatCard";
import { GlassCard } from "../../../src/components/GlassCard";
import { LoadingState } from "../../../src/components/LoadingState";
import { EmptyState } from "../../../src/components/EmptyState";
import { ErrorState } from "../../../src/components/ErrorState";
import { colors } from "../../../src/constants/theme";

export default function TeacherDashboard() {
  const router = useRouter();
  const appUser = useAuthStore((s) => s.appUser);
  const teacherId = appUser?.uid ?? "";
  const { tasks, loading, error, refresh } = useTeacherTasks(teacherId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const todayTasks = tasks.filter((t) => {
    if (!t.deadline) return false;
    const d = t.deadline.toDate();
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const completed = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "accepted");
  const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (loading && !refreshing) return <LoadingState message="Loading your dashboard..." />;

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      {/* Hero */}
      <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "600", marginBottom: 4 }}>
          {greeting}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 }}>
          {appUser?.name ?? "Teacher"}
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: "500", marginTop: 4 }}>
          {appUser?.department ?? ""}
        </Text>

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
          <GlassCard dark style={{ flex: 1, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#60A5FA" }}>{todayTasks.length}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Today</Text>
          </GlassCard>
          <GlassCard dark style={{ flex: 1, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#22C55E" }}>{completed.length}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Done</Text>
          </GlassCard>
          <GlassCard dark style={{ flex: 1, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#FBBF24" }}>{pending.length}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Active</Text>
          </GlassCard>
          <GlassCard dark style={{ flex: 1, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#EF4444" }}>{urgent.length}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Urgent</Text>
          </GlassCard>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>
          Overview
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <StatCard label="Total Tasks" value={tasks.length} color="#1A3A6B" bg="#EFF6FF" icon="\uD83D\uDCCA" />
          <StatCard label="Completed" value={completed.length} color="#22C55E" bg="#DCFCE7" icon="\u2705" />
          <StatCard label="Pending" value={pending.length} color="#F59E0B" bg="#FEF3C7" icon="\u23F3" />
          <StatCard label="Urgent" value={urgent.length} color="#EF4444" bg="#FEE2E2" icon="\u26A0\uFE0F" />
        </View>
      </Animated.View>

      {/* Today's Tasks */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>
            Today's Tasks
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/(teacher)/notifications")}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary[500] }}>View All</Text>
          </TouchableOpacity>
        </View>
        {todayTasks.length === 0 ? (
          <GlassCard style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{"\u2705"}</Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#64748B" }}>No tasks for today!</Text>
          </GlassCard>
        ) : (
          todayTasks.slice(0, 5).map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
        )}
      </Animated.View>

      {/* Recent Tasks */}
      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>
          Recent Tasks
        </Text>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="New tasks from admin will appear here" icon="📭" />
        ) : (
          tasks.slice(0, 10).map((task, i) => <TaskCard key={task.id} task={task} compact index={i} />)
        )}
      </Animated.View>
    </ScrollView>
  );
}
