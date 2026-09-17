import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../src/store/authStore";
import { useAdminTasks } from "../../../src/hooks/useTasks";
import { isOverdue, matchesStatusFilter } from "../../../src/lib/tasks";
import { TaskCard } from "../../../src/components/TaskCard";
import { StatCard } from "../../../src/components/StatCard";
import { GlassCard } from "../../../src/components/GlassCard";
import { LoadingState } from "../../../src/components/LoadingState";
import { EmptyState } from "../../../src/components/EmptyState";
import { ErrorState } from "../../../src/components/ErrorState";
import { colors } from "../../../src/constants/theme";

export default function AdminDashboard() {
  const router = useRouter();
  const appUser = useAuthStore((s) => s.appUser);
  const { tasks, loading, error, refresh } = useAdminTasks();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending" || t.status === "accepted").length;
  const delayed = tasks.filter((t) => isOverdue(t)).length;
  const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const teacherPerformance = tasks.reduce((acc, t) => {
    const teacherId = t.assignedTo[0];
    if (!teacherId) return acc;
    if (!acc[teacherId]) acc[teacherId] = { total: 0, completed: 0, pending: 0 };
    acc[teacherId].total++;
    if (t.status === "completed") acc[teacherId].completed++;
    else if (t.status === "pending" || t.status === "accepted") acc[teacherId].pending++;
    return acc;
  }, {} as Record<string, { total: number; completed: number; pending: number }>);

  const topTeachers = Object.entries(teacherPerformance)
    .map(([id, stats]) => ({
      id,
      ...stats,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  const STATUS_FILTERS = ["all", "pending", "accepted", "completed", "delayed"];

  const visibleTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${t.title} ${t.description ?? ""} ${t.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return matchesStatusFilter(t, statusFilter);
  });

  if (loading && !refreshing) return <LoadingState message="Loading admin dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "600", marginBottom: 4 }}>
          Admin Dashboard
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 }}>
          {appUser?.name ?? "Admin"}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <GlassCard dark style={{ flex: 1, padding: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#60A5FA" }}>{total}</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>Total</Text>
          </GlassCard>
          <GlassCard dark style={{ flex: 1, padding: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#22C55E" }}>{completed}</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>Done</Text>
          </GlassCard>
          <GlassCard dark style={{ flex: 1, padding: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#FBBF24" }}>{pending}</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>Active</Text>
          </GlassCard>
          <GlassCard dark style={{ flex: 1, padding: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#EF4444" }}>{delayed}</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>Delayed</Text>
          </GlassCard>
        </View>
      </Animated.View>

      {/* Create Task CTA */}
      <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ padding: 16, marginTop: 8 }}>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/(admin)/create-task")}
          style={{ backgroundColor: colors.primary[500], borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: colors.primary[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }}
        >
          <Text style={{ fontSize: 20 }}>+</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Create New Task</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInUp.duration(500).delay(150)} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>Overview</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <StatCard label="Completion Rate" value={`${completionRate}%`} color="#22C55E" bg="#DCFCE7" icon="🎯" />
          <StatCard label="Urgent Tasks" value={urgent} color="#EF4444" bg="#FEE2E2" icon="⚠️" />
          <StatCard label="Delayed" value={delayed} color="#F97316" bg="#FFEDD5" icon="⏰" />
          <StatCard label="Total Tasks" value={total} color="#1A3A6B" bg="#EFF6FF" icon="📊" />
        </View>
      </Animated.View>

      {/* Teacher Performance */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>Teacher Performance</Text>
        {topTeachers.length === 0 ? (
          <EmptyState title="No data yet" description="Tasks will appear here once assigned" icon="📊" />
        ) : (
          topTeachers.map((teacher, i) => (
            <GlassCard key={teacher.id} style={{ padding: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: i === 0 ? "#FEF3C7" : "#F1F5F9", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: i === 0 ? "#D97706" : "#64748B" }}>{i + 1}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }}>Teacher {teacher.id.slice(0, 8)}</Text>
                    <Text style={{ fontSize: 12, color: "#64748B" }}>{teacher.completed}/{teacher.total} tasks</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: teacher.rate >= 80 ? "#22C55E" : teacher.rate >= 50 ? "#F59E0B" : "#EF4444" }}>
                    {teacher.rate}%
                  </Text>
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>completion</Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </Animated.View>

      {/* Recent Tasks */}
      <Animated.View entering={FadeInUp.duration(500).delay(250)} style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>Recent Tasks</Text>
          <TouchableOpacity onPress={onRefresh} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary[500] }}>⟳ Refresh</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search all tasks..."
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, paddingRight: 8 }}>
            {STATUS_FILTERS.map((s) => (
              <TouchableOpacity
                key={s}
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
        {visibleTasks.length === 0 ? (
          <EmptyState title={tasks.length === 0 ? "No tasks created yet" : "No matching tasks"} description={tasks.length === 0 ? "Create your first task to get started" : "Try a different search or filter"} icon="📋" />
        ) : (
          visibleTasks.slice(0, 10).map((task, i) => <TaskCard key={task.id} task={task} compact index={i} />)
        )}
      </Animated.View>
    </ScrollView>
  );
}
