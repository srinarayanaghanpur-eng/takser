import { View, Text } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = "\uD83D\uDCED", title, description }: EmptyStateProps) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
        {title}
      </Text>
      {description ? (
        <Text style={{ fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
