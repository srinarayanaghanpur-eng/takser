import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useTaskDetail } from "../../../src/hooks/useTasks";
import { updateTaskDoc, deleteTaskDoc, getAllTeachers } from "../../../src/lib/firestore";
import { confirmAction, showAlert } from "../../../src/lib/confirm";
import { successBuzz, tapTick } from "../../../src/lib/haptics";
import { GlassCard } from "../../../src/components/GlassCard";
import { LoadingState } from "../../../src/components/LoadingState";
import { ErrorState } from "../../../src/components/ErrorState";
import { DateTimeField } from "../../../src/components/DateTimeField";
import { colors } from "../../../src/constants/theme";
import { PRIORITY_CONFIG } from "../../../src/constants/config";
import type { AppUser, TaskCategory, TaskPriority, TaskRecurrence } from "../../../src/types";
import type { ReactNode } from "react";

const CATEGORIES: { key: TaskCategory; label: string; emoji: string }[] = [
  { key: "academic", label: "Academic", emoji: "📚" },
  { key: "homework", label: "Homework", emoji: "✏️" },
  { key: "exam", label: "Exam", emoji: "📋" },
  { key: "meeting", label: "Meeting", emoji: "👥" },
  { key: "documentation", label: "Documentation", emoji: "📄" },
  { key: "student_related", label: "Student", emoji: "👤" },
  { key: "other", label: "Other", emoji: "📋" },
];

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: "low", label: "Low", color: PRIORITY_CONFIG.low.color },
  { key: "medium", label: "Medium", color: PRIORITY_CONFIG.medium.color },
  { key: "high", label: "High", color: PRIORITY_CONFIG.high.color },
  { key: "urgent", label: "Urgent", color: PRIORITY_CONFIG.urgent.color },
];

const RECURRENCE_OPTIONS: { key: TaskRecurrence; label: string }[] = [
  { key: "none", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
];

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  padding: 14,
  fontSize: 15,
  fontWeight: "600" as const,
  color: "#0F172A",
  borderWidth: 1,
  borderColor: "#E2E8F0",
};

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { task, loading, error, refresh } = useTaskDetail(id as string);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("academic");
  const [deadline, setDeadline] = useState(new Date());
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAllTeachers().then(setTeachers).catch(() => {});
  }, []);

  useEffect(() => {
    if (task && !ready) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setCategory(task.category);
      setDeadline(task.deadline?.toDate?.() ?? new Date());
      setRecurrence(task.recurrence ?? "none");
      setAssignedTo(task.assignedTo ?? []);
      setReady(true);
    }
  }, [task, ready]);

  const toggleAssignee = useCallback((uid: string) => {
    tapTick();
    setAssignedTo((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert("Required", "Please enter a task title");
      return;
    }
    if (assignedTo.length === 0) {
      showAlert("Required", "Select at least one teacher");
      return;
    }
    setSaving(true);
    try {
      await updateTaskDoc(id as string, {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        deadline: Timestamp.fromDate(deadline),
        deadlineLabel: "custom",
        recurrence,
        assignedTo,
      });
      successBuzz();
      showAlert("Saved", "Task updated successfully");
      router.back();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAction(
      "Delete Task",
      "Permanently delete this task for all assigned teachers?",
      "Delete"
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteTaskDoc(id as string);
      successBuzz();
      router.replace("/(auth)/(admin)/dashboard");
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !ready) return <LoadingState message="Loading task..." />;
  if (error || !task) return <ErrorState message={error ?? "Task not found"} onRetry={refresh} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "Edit Task", headerTintColor: colors.primary[500] }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <FieldLabel>Task Title</FieldLabel>
            <TextInput value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor="#94A3B8" style={[inputStyle, { marginBottom: 16 }]} />

            <FieldLabel>Description</FieldLabel>
            <TextInput value={description} onChangeText={setDescription} placeholder="Details..." placeholderTextColor="#94A3B8" multiline numberOfLines={3} style={[inputStyle, { marginBottom: 16, minHeight: 80, textAlignVertical: "top" }]} />

            <FieldLabel>Category</FieldLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => { tapTick(); setCategory(c.key); }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: category === c.key ? colors.primary[500] : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: category === c.key ? colors.primary[500] : "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: category === c.key ? "#FFFFFF" : "#64748B" }}>
                    {c.emoji} {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FieldLabel>Priority</FieldLabel>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => { tapTick(); setPriority(p.key); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: priority === p.key ? p.color + "20" : "#FFFFFF",
                    borderWidth: 2,
                    borderColor: priority === p.key ? p.color : "#E2E8F0",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: p.color }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <FieldLabel>Deadline</FieldLabel>
            <View style={{ marginBottom: 16 }}>
              <DateTimeField value={deadline} onChange={setDeadline} />
            </View>

            <FieldLabel>Repeat</FieldLabel>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => { tapTick(); setRecurrence(opt.key); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: recurrence === opt.key ? colors.primary[500] : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: recurrence === opt.key ? colors.primary[500] : "#E2E8F0",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: recurrence === opt.key ? "#FFFFFF" : "#64748B" }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(100)}>
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <FieldLabel>Assigned Teachers ({assignedTo.length})</FieldLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {teachers.map((t) => {
                const selected = assignedTo.includes(t.uid);
                return (
                  <TouchableOpacity
                    key={t.uid}
                    onPress={() => toggleAssignee(t.uid)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: selected ? colors.primary[500] : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: selected ? colors.primary[500] : "#E2E8F0",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#FFFFFF" : "#64748B" }}>
                      {selected ? "✓ " : ""}{t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160)}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: colors.primary[500], borderRadius: 14, padding: 16, alignItems: "center", opacity: saving ? 0.6 : 1, marginBottom: 12 }}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Save Changes</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={{ backgroundColor: "#FEE2E2", borderRadius: 14, padding: 16, alignItems: "center", opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? <ActivityIndicator color="#DC2626" /> : <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "800" }}>Delete Task</Text>}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
