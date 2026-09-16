import { View, Text, TouchableOpacity } from "react-native";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: 28 }}>!</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            marginTop: 16,
            backgroundColor: "#1A3A6B",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
