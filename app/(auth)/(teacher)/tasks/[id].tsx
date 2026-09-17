import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useAuthStore } from "../../../../src/store/authStore";
import { useTaskDetail } from "../../../../src/hooks/useTasks";
import { updateTaskStatus, addTaskComment, getTaskComments, updateTaskProof, updateTaskProofDoc, markTaskSeen, createNotification, createTask, getUsersByIds, saveSubtasks } from "../../../../src/lib/firestore";
import type { TaskComment, Subtask } from "../../../../src/types";
import { pickProofPhoto, uploadProofPhoto, pickProofDocument, uploadProofDocument } from "../../../../src/lib/storage";
import { sendTaskSirenPush } from "../../../../src/lib/notifications";
import { confirmAction, showAlert } from "../../../../src/lib/confirm";
import { successBuzz, tapTick } from "../../../../src/lib/haptics";
import { authenticateToMarkTask } from "../../../../src/lib/biometric";
import { PriorityBadge } from "../../../../src/components/PriorityBadge";
import { GlassCard } from "../../../../src/components/GlassCard";
import { LoadingState } from "../../../../src/components/LoadingState";
import { ErrorState } from "../../../../src/components/ErrorState";
import { colors } from "../../../../src/constants/theme";

const categoryLabels: Record<string, string> = {
  academic: "Academic",
  homework: "Homework",
  exam: "Exam",
  meeting: "Meeting",
  documentation: "Documentation",
  student_related: "Student Related",
  other: "Other",
};

export default function TeacherTaskDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const appUser = useAuthStore((s) => s.appUser);
  const { task, loading, error, refresh } = useTaskDetail(id as string);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      getTaskComments(id as string).then(setComments).catch(() => {});
      if (appUser?.uid) markTaskSeen(id as string, appUser.uid);
    }
  }, [id]);

  useEffect(() => {
    if (task?.subtasks) setSubtasks(task.subtasks);
  }, [task?.id]);

  const persistSubtasks = async (next: Subtask[]) => {
    setSubtasks(next);
    try {
      await saveSubtasks(id as string, next);
    } catch {
      showAlert("Error", "Failed to save checklist");
    }
  };

  const toggleSubtask = (subId: string) => {
    tapTick();
    persistSubtasks(subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)));
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    persistSubtasks([...subtasks, { id: `sub-${Date.now()}`, title: newSubtask.trim(), done: false }]);
    setNewSubtask("");
  };

  const handleAccept = async () => {
    const verified = await authenticateToMarkTask("accept this task");
    if (!verified) return;
    try {
      await updateTaskStatus(id as string, "accepted");
      successBuzz();
      refresh();
    } catch (e) {
      showAlert("Error", "Failed to accept task");
    }
  };

  const handleComplete = async () => {
    const ok = await confirmAction("Complete Task", "Mark this task as completed?", "Complete");
    if (!ok) return;
    const verified = await authenticateToMarkTask("mark this task complete");
    if (!verified) return;
    try {
      await updateTaskStatus(id as string, "completed");
      successBuzz();
      if (task && (task.recurrence === "daily" || task.recurrence === "weekly")) {
        const nextDeadline = new Date(deadlineDate);
        nextDeadline.setDate(nextDeadline.getDate() + (task.recurrence === "daily" ? 1 : 7));
        createTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          category: task.category,
          deadline: Timestamp.fromDate(nextDeadline),
          deadlineLabel: "custom",
          recurrence: task.recurrence,
          status: "pending",
          assignment: task.assignment,
          assignedTo: task.assignedTo,
          assignedBy: task.assignedBy,
          assignedByName: task.assignedByName,
          reminderSent: false,
        }).catch(() => {});
      }
      refresh();
    } catch {
      showAlert("Error", "Failed to complete task");
    }
  };

  const handleAddProof = async () => {
    setUploading(true);
    try {
      const photo = await pickProofPhoto();
      if (!photo) return;
      const url = await uploadProofPhoto(id as string, photo);
      await updateTaskProof(id as string, url);
      successBuzz();
      refresh();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleAddProofDoc = async () => {
    setUploading(true);
    try {
      const picked = await pickProofDocument();
      if (!picked) return;
      const url = await uploadProofDocument(id as string, picked);
      await updateTaskProofDoc(id as string, url, picked.name);
      successBuzz();
      refresh();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };
  const handleAddComment = async () => {
    if (!commentText.trim() || !appUser) return;
    setSubmitting(true);
    try {
      await addTaskComment(id as string, appUser.uid, appUser.name, commentText.trim());
      setCommentText("");
      const updated = await getTaskComments(id as string);
      setComments(updated);
      if (task && task.assignedBy && task.assignedBy !== appUser.uid) {
        const notifId = await createNotification({
          uid: task.assignedBy,
          title: `New comment on "${task.title}"`,
          body: `${appUser.name}: ${commentText.trim().slice(0, 100)}`,
          type: "task_updated",
          taskId: id as string,
          read: false,
        }).catch(() => null);
        if (notifId) {
          getUsersByIds([task.assignedBy])
            .then((users) => {
              const tokens = users.filter((u) => u.fcmToken).map((u) => ({ pushToken: u.fcmToken as string, taskId: id as string }));
              if (tokens.length > 0) {
                return sendTaskSirenPush(tokens, `New comment on "${task.title}"`, `${appUser.name} commented on the task.`);
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      showAlert("Error", "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading task..." />;
  if (error || !task) return <ErrorState message={error ?? "Task not found"} onRetry={refresh} />;

  const canAccept = task.status === "pending";
  const canComplete = task.status === "accepted";
  const deadlineDate = task.deadline?.toDate?.() ?? new Date();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Task Details", headerTintColor: colors.primary[500] }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)}>
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

            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", marginBottom: 2 }}>DEADLINE</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }}>{format(deadlineDate, "MMM d, yyyy h:mm a")}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", marginBottom: 2 }}>ASSIGNED BY</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }}>{task.assignedByName}</Text>
              </View>
            </View>
          </GlassCard>
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {canAccept && (
              <TouchableOpacity onPress={handleAccept} style={{ flex: 1, backgroundColor: colors.primary[500], borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}>Accept Task</Text>
              </TouchableOpacity>
            )}
            {canComplete && (
              <TouchableOpacity onPress={handleComplete} style={{ flex: 1, backgroundColor: "#22C55E", borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}>Mark Complete</Text>
              </TouchableOpacity>
            )}
            {task.status === "completed" && (
              <View style={{ flex: 1, backgroundColor: "#DCFCE7", borderRadius: 14, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#166534", fontWeight: "800", fontSize: 15 }}>✅ Completed</Text>
              </View>
            )}
          </Animated.View>

          {/* Proof */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)}>
          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>Proof of Work</Text>
            {task.proofImageUrl ? (
              <Image
                source={{ uri: task.proofImageUrl }}
                style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: "#F1F5F9" }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", paddingVertical: 12 }}>
                No proof attached yet
              </Text>
            )}
            {task.status !== "completed" && (
              <TouchableOpacity
                onPress={handleAddProof}
                disabled={uploading}
                style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 12, padding: 12, alignItems: "center", opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? (
                  <ActivityIndicator color="#1A3A6B" />
                ) : (
                  <Text style={{ color: "#1A3A6B", fontWeight: "700" }}>
                    {task.proofImageUrl ? "Replace Photo" : "Add Proof Photo"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {task.proofDocUrl ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" }}>
                <Text style={{ fontSize: 20 }}>📄</Text>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#334155" }} numberOfLines={1}>
                  {task.proofDocName ?? "Document"}
                </Text>
              </View>
            ) : null}
            {task.status !== "completed" && (
              <TouchableOpacity
                onPress={handleAddProofDoc}
                disabled={uploading}
                style={{ marginTop: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12, alignItems: "center", opacity: uploading ? 0.6 : 1 }}
              >
                <Text style={{ color: "#64748B", fontWeight: "700" }}>
                  {task.proofDocUrl ? "Replace PDF" : "Attach PDF"}
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
          </Animated.View>

          {/* Checklist */}
          <Animated.View entering={FadeInUp.duration(400).delay(175)}>
          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>
              Checklist{subtasks.length > 0 ? ` (${subtasks.filter((s) => s.done).length}/${subtasks.length})` : ""}
            </Text>
            {subtasks.map((s) => (
              <TouchableOpacity key={s.id} onPress={() => toggleSubtask(s.id)} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.done ? "#22C55E" : "#FFFFFF", borderWidth: 2, borderColor: s.done ? "#22C55E" : "#CBD5E1", justifyContent: "center", alignItems: "center" }}>
                  {s.done && <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>✓</Text>}
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: s.done ? "#94A3B8" : "#334155", textDecorationLine: s.done ? "line-through" : "none" }}>
                  {s.title}
                </Text>
              </TouchableOpacity>
            ))}
            {task.status !== "completed" && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TextInput
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  placeholder="Add a step..."
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#E2E8F0" }}
                />
                <TouchableOpacity onPress={addSubtask} disabled={!newSubtask.trim()} style={{ backgroundColor: colors.primary[500], borderRadius: 12, padding: 12, justifyContent: "center", opacity: !newSubtask.trim() ? 0.5 : 1 }}>
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
          </Animated.View>

          {/* Comments */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)}>
          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 }}>Comments</Text>
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
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#E2E8F0" }}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={submitting || !commentText.trim()} style={{ backgroundColor: colors.primary[500], borderRadius: 12, padding: 12, justifyContent: "center", opacity: submitting || !commentText.trim() ? 0.5 : 1 }}>
                {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: "#FFF", fontWeight: "700" }}>Send</Text>}
              </TouchableOpacity>
            </View>
          </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
