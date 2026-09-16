import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../../../src/constants/theme";

export default function AdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <BlurView
            intensity={85}
            tint="light"
            style={{
              flex: 1,
              backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.82)" : undefined,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
            }}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>{"📊"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          title: "Teachers",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>{"👥"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>{"🔔"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>{"👤"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="create-task"
        options={{
          title: "New Task",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4 }}>{"➕"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
