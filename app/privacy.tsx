import { Text, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Stack } from "expo-router";
import { GlassCard } from "../src/components/GlassCard";
import { colors } from "../src/constants/theme";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Data We Collect",
    body: "Employee ID, name, department, login credentials (email derived from employee ID), assigned tasks, task status updates, comments, proof photos/documents you attach, and push notification tokens.",
  },
  {
    title: "How We Use It",
    body: "To assign and track teaching tasks, send deadline reminders and new-task alerts, measure completion performance, and manage staff accounts. Data is visible to school administrators.",
  },
  {
    title: "Data Storage",
    body: "Data is stored securely in Google Firebase (Firestore, Authentication, Storage) with role-based access rules. Only authenticated staff can access the app.",
  },
  {
    title: "Photos & Files",
    body: "Proof photos and documents you attach are stored in Firebase Storage and visible to administrators for verification only.",
  },
  {
    title: "Notifications",
    body: "We send task alerts via push notifications. You can disable them in your device settings; in-app alerts will still appear.",
  },
  {
    title: "Account Removal",
    body: "Contact your school administrator to disable your account. Disabled accounts immediately lose access; task history is retained for school records.",
  },
  {
    title: "Contact",
    body: "For privacy questions, contact the school administration office.",
  },
];

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Privacy Policy", headerTintColor: colors.primary[500] }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard style={{ padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 4 }}>
              Privacy Policy
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
              Sri Narayana Teacher Tasks · Last updated August 2026
            </Text>
            {SECTIONS.map((s) => (
              <Animated.View key={s.title} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 4 }}>
                  {s.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#475569", lineHeight: 21 }}>{s.body}</Text>
              </Animated.View>
            ))}
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </>
  );
}
