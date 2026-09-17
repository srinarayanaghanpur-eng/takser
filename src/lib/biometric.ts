import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { confirmAction } from "./confirm";

const CRED_EMPLOYEE_KEY = "saved_employee_id";
const CRED_PASSWORD_KEY = "saved_login_password";

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
): Promise<boolean> {  if (Platform.OS === "web") {
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

export async function saveLoginCredential(employeeId: string, password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(CRED_EMPLOYEE_KEY, employeeId);
    await SecureStore.setItemAsync(CRED_PASSWORD_KEY, password);
  } catch {}
}

export async function getSavedCredential(): Promise<{ employeeId: string; password: string } | null> {
  try {
    const employeeId = await SecureStore.getItemAsync(CRED_EMPLOYEE_KEY);
    const password = await SecureStore.getItemAsync(CRED_PASSWORD_KEY);
    if (employeeId && password) return { employeeId, password };
    return null;
  } catch {
    return null;
  }
}

export async function clearSavedCredential(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CRED_EMPLOYEE_KEY);
    await SecureStore.deleteItemAsync(CRED_PASSWORD_KEY);
  } catch {}
}

export async function authenticateForQuickLogin(): Promise<boolean> {
  if (Platform.OS === "web") {
    return confirmAction("Quick Login", "Use your saved login?", "Continue");
  }
  try {
    const available = await isBiometricAvailable();
    if (!available) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Log in with biometrics",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
