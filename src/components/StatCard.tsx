import { View, Text } from "react-native";

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  icon?: string;
}

export function StatCard({ label, value, color, bg, icon }: StatCardProps) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: "#1E3A5F",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        flex: 1,
        minWidth: 140,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: bg,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {icon ? (
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color,
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#64748B",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
