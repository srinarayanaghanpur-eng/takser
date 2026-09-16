import { View, Text } from "react-native";
import { PRIORITY_CONFIG } from "../constants/config";
import type { TaskPriority } from "../types";

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const isSmall = size === "sm";

  return (
    <View
      style={{
        backgroundColor: config.bg,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: 6,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: config.color,
          fontSize: isSmall ? 11 : 13,
          fontWeight: "800",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
