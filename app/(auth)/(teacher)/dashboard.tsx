import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/store/authStore";
import { useTeacherTasks } from "../../../src/hooks/useTasks";
import { scheduleDeadlineReminders } from "../../../src/lib/notifications";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    if (tasks.length > 0) {
      scheduleDeadlineReminders(
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          deadlineMillis: t.deadline?.toDate?.()?.getTime() ?? 0,
          status: t.status,
        }))
      ).catch(() => {});
    }
  }, [tasks]);

  const todayTasks = tasks.filter((t) => {
    if (!t.deadline) return false;
    const d = t.deadline.toDate();
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const completed = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "accepted");
  const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed");

  const STATUS_FILTERS = ["all", "pending", "accepted", "completed"];
  const PRIORITY_FILTERS = ["all", "urgent", "high", "medium", "low"];

  const visibleTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${t.title} ${t.description ?? ""} ${t.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

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
          <StatCard label="Total Tasks" value={tasks.length} color="#1A3A6B" bg="#EFF6FF" icon="📊" />
          <StatCard label="Completed" value={completed.length} color="#22C55E" bg="#DCFCE7" icon="✅" />
          <StatCard label="Pending" value={pending.length} color="#F59E0B" bg="#FEF3C7" icon="⏳" />
          <StatCard label="Urgent" value={urgent.length} color="#EF4444" bg="#FEE2E2" icon="⚠️" />
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
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{"✅"}</Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#64748B" }}>No tasks for today!</Text>
          </GlassCard>
        ) : (
          todayTasks.slice(0, 5).map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
        )}
      </Animated.View>

      {/* Recent Tasks */}
      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>
            Recent Tasks
          </Text>
          <TouchableOpacity onPress={onRefresh} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary[500] }}>⟳ Refresh</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search tasks..."
          placeholderTextColor="#94A3B8"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            fontWeight: "600",
            color: "#0F172A",
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: "row", gap: 6, paddingRight: 8 }}>
            {STATUS_FILTERS.map((s) => (
              <TouchableOpacity
                key={`s-${s}`}
                onPress={() => setStatusFilter(s)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: statusFilter === s ? colors.primary[500] : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: statusFilter === s ? colors.primary[500] : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: statusFilter === s ? "#FFFFFF" : "#64748B", textTransform: "capitalize" }}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, paddingRight: 8 }}>
            {PRIORITY_FILTERS.map((p) => (
              <TouchableOpacity
                key={`p-${p}`}
                onPress={() => setPriorityFilter(p)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: priorityFilter === p ? "#F59E0B" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: priorityFilter === p ? "#F59E0B" : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: priorityFilter === p ? "#FFFFFF" : "#64748B", textTransform: "capitalize" }}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {visibleTasks.length === 0 ? (
          <EmptyState title={tasks.length === 0 ? "No tasks yet" : "No matching tasks"} description={tasks.length === 0 ? "New tasks from admin will appear here" : "Try a different search or filter"} icon="📭" />
        ) : (
          visibleTasks.slice(0, 10).map((task, i) => <TaskCard key={task.id} task={task} compact index={i} />)
        )}
      </Animated.View>
    </ScrollView>
  );
}
