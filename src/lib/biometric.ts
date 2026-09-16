import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { confirmAction } from "./confirm";

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function authenticateToMarkTask(
  actionLabel = "mark this task"
): Promise<boolean> {
  if (Platform.OS === "web") {
    return confirmAction(
      "Verify Identity",
      `Confirm to ${actionLabel}.`,
      "Verify"
    );
  }

  try {
    const available = await isBiometricAvailable();
    if (!available) {
      return confirmAction(
        "Verify Identity",
        `No biometrics are set up on this device.\n\nConfirm to ${actionLabel}.`,
        "Verify"
      );
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Verify to ${actionLabel}`,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
