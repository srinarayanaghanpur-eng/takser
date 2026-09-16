import { View, Text, ScrollView, RefreshControl, TextInput, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { getAllTeachers } from "../../../src/lib/firestore";
import { GlassCard } from "../../../src/components/GlassCard";
import { LoadingState } from "../../../src/components/LoadingState";
import { EmptyState } from "../../../src/components/EmptyState";
import { ErrorState } from "../../../src/components/ErrorState";
import { colors } from "../../../src/constants/theme";
import type { AppUser } from "../../../src/types";

export default function AdminTeachers() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      t.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState message="Loading teachers..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={{ backgroundColor: colors.primary[500], paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFFFFF" }}>Teachers</Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              {teachers.length} registered teachers
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/(admin)/add-teacher")}
            style={{ backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary[500] }}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={{ padding: 16 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search teachers..."
          placeholderTextColor="#94A3B8"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 14,
            fontSize: 15,
            fontWeight: "600",
            color: "#0F172A",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            shadowColor: "#1E3A5F",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}
        />

        {filtered.length === 0 ? (
          <EmptyState
            title={search ? "No teachers found" : "No teachers registered"}
            description={search ? "Try a different search term" : "Add teachers from the admin panel"}
            icon="👥"
          />
        ) : (
          filtered.map((teacher, i) => (
            <Animated.View key={teacher.uid} entering={FadeInUp.duration(400).delay(Math.min(i, 8) * 60)}>
            <TouchableOpacity
              onPress={() => router.push(`/(auth)/(admin)/teacher-detail?id=${teacher.uid}`)}
              activeOpacity={0.7}
            >
            <GlassCard style={{ padding: 16, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primary[500] }}>
                    {teacher.name?.charAt(0)?.toUpperCase() ?? "T"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>{teacher.name}</Text>
                  <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                    {teacher.employeeId} {teacher.department ? `· ${teacher.department}` : ""}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: "#CBD5E1" }}>›</Text>
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
