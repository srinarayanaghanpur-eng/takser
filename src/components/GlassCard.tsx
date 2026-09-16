import { View, Platform, type ViewProps } from "react-native";

interface GlassCardProps extends ViewProps {
  dark?: boolean;
}

export function GlassCard({ style, dark, children, ...props }: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: dark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.75)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: dark ? "rgba(148,163,184,0.1)" : "rgba(255,255,255,0.3)",
          shadowColor: dark ? "#000" : "#1E3A5F",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: dark ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: 4,
          ...(Platform.OS === "web"
            ? ({ backdropFilter: "blur(12px)" } as object)
            : null),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
