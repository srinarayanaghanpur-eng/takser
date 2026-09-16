import { View, Text, ActivityIndicator } from "react-native";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
      <ActivityIndicator size="large" color="#1A3A6B" />
      <Text style={{ marginTop: 16, fontSize: 15, color: "#64748B", fontWeight: "500" }}>
        {message}
      </Text>
    </View>
  );
}
