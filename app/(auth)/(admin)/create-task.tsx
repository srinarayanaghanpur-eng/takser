import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { createTask, getAllTeachers, createNotification, getUsersByIds } from "../../../src/lib/firestore";
import { sendTaskSirenPush } from "../../../src/lib/notifications";
import { successBuzz } from "../../../src/lib/haptics";
import { showAlert } from "../../../src/lib/confirm";
import { useAuthStore } from "../../../src/store/authStore";
import { GlassCard } from "../../../src/components/GlassCard";
import { colors } from "../../../src/constants/theme";
import { PRIORITY_CONFIG } from "../../../src/constants/config";
import type { AppUser, TaskCategory, TaskPriority, TaskAssignment } from "../../../src/types";

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

const DEADLINE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "custom", label: "Custom" },
];

const ASSIGNMENT_TYPES: { key: string; label: string }[] = [
  { key: "individual", label: "Individual Teacher" },
  { key: "class_teacher", label: "Class Teachers" },
  { key: "department", label: "Department" },
  { key: "all", label: "All Teachers" },
];

export default function CreateTaskScreen() {
  const router = useRouter();
  const appUser = useAuthStore((s) => s.appUser);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("academic");
  const [deadlineLabel, setDeadlineLabel] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDate, setCustomDate] = useState("");
  const [assignmentType, setAssignmentType] = useState("individual");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTeachers = async () => {
      const data = await getAllTeachers();
      setTeachers(data);
    };
    loadTeachers().catch(() => {});
  }, []);

  const computeDeadline = (): Date => {
    const now = new Date();
    if (deadlineLabel === "today") {
      const d = new Date(now);
      d.setHours(23, 59, 0, 0);
      return d;
    }
    if (deadlineLabel === "tomorrow") {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 0, 0);
      return d;
    }
    const parsed = new Date(customDate);
    return isNaN(parsed.getTime()) ? now : parsed;
  };

  const computeAssignment = (): TaskAssignment => {
    switch (assignmentType) {
      case "class_teacher": return { type: "class_teacher" };
      case "department": return { type: "department", department: selectedDepartment || "general" };
      case "all": return { type: "all" };
      default: return { type: "individual", teacherId: selectedTeacher };
    }
  };

  const computeAssignedTo = (): string[] => {
    if (assignmentType === "individual" && selectedTeacher) return [selectedTeacher];
    if (assignmentType === "class_teacher") return teachers.filter((t) => t.isClassTeacher).map((t) => t.uid);
    if (assignmentType === "department") return teachers.filter((t) => t.department === selectedDepartment).map((t) => t.uid);
    return teachers.map((t) => t.uid);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert("Required", "Please enter a task title");
      return;
    }
    if (assignmentType === "individual" && !selectedTeacher) {
      showAlert("Required", "Please select a teacher");
      return;
    }
    if (assignmentType === "department" && !selectedDepartment) {
      showAlert("Required", "Please select a department");
      return;
    }

    setSubmitting(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        deadline: Timestamp.fromDate(computeDeadline()),
        deadlineLabel,
        status: "pending" as const,
        assignment: computeAssignment(),
        assignedTo: computeAssignedTo(),
        assignedBy: appUser?.uid ?? "",
        assignedByName: appUser?.name ?? "Admin",
        reminderSent: false,
      };
      const newTaskId = await createTask(taskData);
      const assignedIds = computeAssignedTo();
      await Promise.all(
        assignedIds.map((uid) =>
          createNotification({
            uid,
            title: "New task assigned",
            body: `${taskData.title} is due ${deadlineLabel}.`,
            type: "new_task",
            taskId: newTaskId,
            read: false,
          }).catch(() => {})
        )
      );
      try {
        const assignees = await getUsersByIds(assignedIds);
        await sendTaskSirenPush(
          assignees
            .filter((u) => u.fcmToken)
            .map((u) => ({ pushToken: u.fcmToken as string, taskId: newTaskId })),
          "New task assigned",
          `${taskData.title} is due ${deadlineLabel}.`
        );
      } catch {}
      showAlert("Success", "Task created and assigned successfully");
      successBuzz();
      router.back();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFFFFF" }}>Create Task</Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
            Assign work to your teachers
          </Text>
        </Animated.View>
        <View style={{ padding: 16 }}>
        {/* Title */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Task Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter task title"
          placeholderTextColor="#94A3B8"
          style={inputStyle}
        />

        {/* Description */}
        <Text style={[labelStyle, { marginTop: 16 }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the task..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          style={[inputStyle, { height: 100, textAlignVertical: "top" }]}
        />

        {/* Category */}
        <Text style={[labelStyle, { marginTop: 16 }]}>Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={{
                paddingHorizontal: 14,
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

        {/* Priority */}
        <Text style={[labelStyle, { marginTop: 16 }]}>Priority</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPriority(p.key)}
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

        {/* Deadline */}
        <Text style={[labelStyle, { marginTop: 16 }]}>Deadline</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DEADLINE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setDeadlineLabel(opt.key as typeof deadlineLabel)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: deadlineLabel === opt.key ? colors.primary[500] : "#FFFFFF",
                borderWidth: 1,
                borderColor: deadlineLabel === opt.key ? colors.primary[500] : "#E2E8F0",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: deadlineLabel === opt.key ? "#FFFFFF" : "#64748B" }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {deadlineLabel === "custom" && (
          <TextInput
            value={customDate}
            onChangeText={setCustomDate}
            placeholder="YYYY-MM-DD HH:MM"
            placeholderTextColor="#94A3B8"
            style={[inputStyle, { marginTop: 8 }]}
          />
        )}

        {/* Assignment */}
        <Text style={[labelStyle, { marginTop: 16 }]}>Assign To</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {ASSIGNMENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setAssignmentType(t.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: assignmentType === t.key ? colors.primary[500] : "#FFFFFF",
                borderWidth: 1,
                borderColor: assignmentType === t.key ? colors.primary[500] : "#E2E8F0",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: assignmentType === t.key ? "#FFFFFF" : "#64748B" }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {assignmentType === "individual" && (
          <ScrollView horizontal style={{ marginTop: 8 }} showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {teachers.map((t) => (
                <TouchableOpacity
                  key={t.uid}
                  onPress={() => setSelectedTeacher(t.uid)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: selectedTeacher === t.uid ? colors.primary[500] : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: selectedTeacher === t.uid ? colors.primary[500] : "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: selectedTeacher === t.uid ? "#FFFFFF" : "#64748B" }}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {assignmentType === "department" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {[...new Set(teachers.map((t) => t.department).filter(Boolean))].map((dept) => (
              <TouchableOpacity
                key={dept}
                onPress={() => setSelectedDepartment(dept ?? "")}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: selectedDepartment === dept ? colors.primary[500] : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: selectedDepartment === dept ? colors.primary[500] : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: selectedDepartment === dept ? "#FFFFFF" : "#64748B" }}>
                  {dept}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 24,
            backgroundColor: colors.primary[500],
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: submitting ? 0.6 : 1,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Create & Assign Task</Text>
          )}
        </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

const labelStyle = {
  fontSize: 13,
  fontWeight: "700" as const,
  color: "#64748B",
  marginBottom: 8,
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
};
