import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { PriorityBadge } from "./PriorityBadge";
import { GlassCard } from "./GlassCard";
import { useAuthStore } from "../store/authStore";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  index?: number;
}

const categoryEmoji: Record<string, string> = {
  academic: "📚",
  homework: "✏️",
  exam: "📋",
  meeting: "👥",
  documentation: "📄",
  student_related: "👤",
  other: "📋",
};

export function TaskCard({ task, compact, index = 0 }: TaskCardProps) {
  const router = useRouter();
  const role = useAuthStore((s) => s.appUser?.role);

  const deadlineDate = task.deadline?.toDate?.() ?? new Date();
  const isOverdue = task.status !== "completed" && deadlineDate < new Date();
  const statusColors: Record<string, string> = {
    pending: "#F59E0B",
    accepted: "#3B82F6",
    completed: "#22C55E",
    delayed: "#EF4444",
  };

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(
          role === "admin"
            ? `/(auth)/(admin)/tasks/${task.id}`
            : `/(auth)/(teacher)/tasks/${task.id}`
        )
      }
      activeOpacity={0.7}
    >
      <Animated.View entering={FadeInUp.duration(400).delay(Math.min(index, 8) * 60)}>
      <GlassCard style={{ padding: compact ? 12 : 16, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 16 }}>{categoryEmoji[task.category] ?? "📋"}</Text>
              <PriorityBadge priority={task.priority} size={compact ? "sm" : "md"} />
              {isOverdue && (
                <View style={{ backgroundColor: "#FEE2E2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#EF4444" }}>OVERDUE</Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: compact ? 15 : 17,
                fontWeight: "700",
                color: "#0F172A",
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {!compact && task.description ? (
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748B",
                  lineHeight: 18,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColors[task.status] ?? "#CBD5E1",
              marginTop: 6,
            }}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: compact ? 6 : 10, paddingTop: compact ? 6 : 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#94A3B8" }}>
            {"📅"} {format(deadlineDate, "MMM d, h:mm a")}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#94A3B8" }}>
            {task.assignedByName ?? "System"}
          </Text>
        </View>
      </GlassCard>
      </Animated.View>
    </TouchableOpacity>
  );
}
