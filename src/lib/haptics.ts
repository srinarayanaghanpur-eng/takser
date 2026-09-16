import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

async function safe(fn: () => Promise<void>): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await fn();
  } catch {}
}

export function tapTick(): void {
  void safe(() => Haptics.selectionAsync());
}

export function successBuzz(): void {
  void safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function errorBuzz(): void {
  void safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function mediumThud(): void {
  void safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
