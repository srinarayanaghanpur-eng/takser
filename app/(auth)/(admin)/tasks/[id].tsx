import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, Stack } from "expo-router";
import { format } from "date-fns";
import { useTaskDetail } from "../../../../src/hooks/useTasks";
import { getTaskComments } from "../../../../src/lib/firestore";
import { PriorityBadge } from "../../../../src/components/PriorityBadge";
import { GlassCard } from "../../../../src/components/GlassCard";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { colors } from "../../../../src/constants/theme";
import type { TaskComment } from "../../../../src/types";

const categoryLabels: Record<string, string> = {
  academic: "Academic", homework: "Homework", exam: "Exam", meeting: "Meeting",
  documentation: "Documentation", student_related: "Student Related", other: "Other",
};

export default function AdminTaskDetail() {
  const { id } = useLocalSearchParams();
  const { task, loading, error, refresh } = useTaskDetail(id as string);
  const [comments, setComments] = useState<TaskComment[]>([]);

  useEffect(() => {
    if (id) getTaskComments(id as string).then(setComments).catch(() => {});
  }, [id]);

  if (loading) return <LoadingState message="Loading task..." />;
  if (error || !task) return <ErrorState message={error ?? "Task not found"} onRetry={refresh} />;

  const deadlineDate = task.deadline?.toDate?.() ?? new Date();
  const assignTypeLabels: Record<string, string> = {
    individual: "Individual Teacher",
    class_teacher: "Class Teachers",
    department: `Department: ${(task.assignment as any)?.department ?? ""}`,
    all: "All Teachers",
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Task Details", headerTintColor: colors.primary[500] }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <GlassCard style={{ padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 8 }}>{task.title}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <PriorityBadge priority={task.priority} size="md" />
                <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary[500] }}>{categoryLabels[task.category] ?? task.category}</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: task.status === "completed" ? "#22C55E" : task.status === "accepted" ? "#3B82F6" : "#F59E0B" }} />
          </View>

          <Text style={{ fontSize: 15, color: "#475569", lineHeight: 22, marginBottom: 16 }}>{task.description}</Text>

          <View style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
            <DetailRow label="Deadline" value={format(deadlineDate, "MMM d, yyyy h:mm a")} />
            <DetailRow label="Assigned By" value={task.assignedByName} />
            <DetailRow label="Assignment" value={assignTypeLabels[(task.assignment as any)?.type] ?? "Unknown"} />
            <DetailRow label="Status" value={task.status.toUpperCase()} />
            <DetailRow label="Assigned To" value={`${task.assignedTo.length} teacher(s)`} />
          </View>
        </GlassCard>

        {/* Comments */}
        <GlassCard style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>Comments ({comments.length})</Text>
          {comments.length === 0 ? (
            <Text style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", paddingVertical: 16 }}>No comments yet</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary[500] }}>{c.userName}</Text>
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>{c.createdAt?.toDate?.() ? format(c.createdAt.toDate(), "MMM d, h:mm a") : ""}</Text>
                </View>
                <Text style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>{c.text}</Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#94A3B8" }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#0F172A", textAlign: "right", maxWidth: "60%" }}>{value}</Text>
    </View>
  );
}
