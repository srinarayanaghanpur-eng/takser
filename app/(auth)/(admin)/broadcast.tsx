import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState } from "react";
import { useRouter, Stack } from "expo-router";
import { getAllTeachers, createNotification } from "../../../src/lib/firestore";
import { sendTaskSirenPush } from "../../../src/lib/notifications";
import { showAlert } from "../../../src/lib/confirm";
import { successBuzz } from "../../../src/lib/haptics";
import { GlassCard } from "../../../src/components/GlassCard";
import { colors } from "../../../src/constants/theme";

export default function BroadcastScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      showAlert("Required", "Please enter both a title and a message");
      return;
    }
    setSending(true);
    try {
      const teachers = await getAllTeachers();
      if (teachers.length === 0) {
        showAlert("No Teachers", "There are no registered teachers to notify");
        return;
      }
      await Promise.all(
        teachers.map((t) =>
          createNotification({
            uid: t.uid,
            title: title.trim(),
            body: body.trim(),
            type: "reminder",
            read: false,
          }).catch(() => {})
        )
      );
      try {
        const tokens = teachers
          .filter((t) => t.fcmToken)
          .map((t) => ({ pushToken: t.fcmToken as string }));
        if (tokens.length > 0) {
          await sendTaskSirenPush(tokens, title.trim(), body.trim());
        }
      } catch {}
      successBuzz();
      showAlert("Sent", `Notice delivered to ${teachers.length} teacher(s)`);
      router.back();
    } catch (e) {
      showAlert("Error", e instanceof Error ? e.message : "Failed to send notice");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ headerShown: true, title: "Broadcast Notice", headerTintColor: colors.primary[500] }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Notice Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Staff meeting at 4 PM"
              placeholderTextColor="#94A3B8"
              style={{ backgroundColor: "#F8FAFC", borderRadius: 14, padding: 16, fontSize: 16, fontWeight: "600", color: "#0F172A", marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" }}
            />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Message
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write your announcement..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              style={{ backgroundColor: "#F8FAFC", borderRadius: 14, padding: 16, fontSize: 15, color: "#0F172A", marginBottom: 8, minHeight: 120, textAlignVertical: "top", borderWidth: 1, borderColor: "#E2E8F0" }}
            />
            <Text style={{ fontSize: 12, color: "#94A3B8" }}>
              Goes to every teacher as an in-app alert + siren push.
            </Text>
          </GlassCard>
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(400).delay(100)}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending}
            style={{ backgroundColor: colors.primary[500], borderRadius: 14, padding: 16, alignItems: "center", opacity: sending ? 0.6 : 1 }}
          >
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Send to All Teachers</Text>}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
