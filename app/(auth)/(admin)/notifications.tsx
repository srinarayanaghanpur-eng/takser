import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useAuthStore } from "../../../src/store/authStore";
import { getNotificationsForUser, markNotificationRead, markAllNotificationsRead } from "../../../src/lib/firestore";
import { GlassCard } from "../../../src/components/GlassCard";
import { LoadingState } from "../../../src/components/LoadingState";
import { EmptyState } from "../../../src/components/EmptyState";
import { colors } from "../../../src/constants/theme";
import type { AppNotification } from "../../../src/types";

const typeEmojis: Record<string, string> = {
  new_task: "\uD83D\uDCE5",
  deadline_approaching: "\u23F0",
  task_updated: "\uD83D\uDD04",
  reminder: "\uD83D\uDD14",
};

export default function AdminNotifications() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await getNotificationsForUser(uid);
      setNotifications(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (notif.taskId) {
      router.push(`/(auth)/(admin)/tasks/${notif.taskId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <LoadingState />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFFFFF" }}>Notifications</Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <View style={{ padding: 16 }}>
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" icon="\uD83D\uDD14" />
        ) : (
          notifications.map((notif, i) => (
            <Animated.View key={notif.id} entering={FadeInUp.duration(400).delay(Math.min(i, 8) * 60)}>
            <TouchableOpacity onPress={() => handlePress(notif)} activeOpacity={0.7}>
              <GlassCard style={{ padding: 14, marginBottom: 8, opacity: notif.read ? 0.7 : 1 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>{typeEmojis[notif.type] ?? "\uD83D\uDCE2"}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={{ fontSize: 15, fontWeight: notif.read ? "600" : "800", color: "#0F172A", flex: 1, marginRight: 8 }}>
                        {notif.title}
                      </Text>
                      {!notif.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500] }} />}
                    </View>
                    <Text style={{ fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 18 }}>{notif.body}</Text>
                    <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "600", marginTop: 6 }}>
                      {notif.createdAt?.toDate?.() ? format(notif.createdAt.toDate(), "MMM d, h:mm a") : ""}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
