import * as Device from "expo-device";
import { Platform } from "react-native";

export const SIREN_CHANNEL_ID = "task-siren";
export const SIREN_SOUND = "siren.wav";

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = require("expo-notifications") as NotificationsModule;
  } catch {
    // Expo Go (SDK 53+) removed remote push: run without notifications.
    cached = null;
  }
  return cached;
}

function isPushSupported(): boolean {
  if (Platform.OS === "web") return false;
  try {
    if (!Device.isDevice) return false;
  } catch {
    return false;
  }
  return getNotifications() !== null;
}

export async function registerForPushNotifications(): Promise<string | null> {
  const N = getNotifications();
  if (!N || !isPushSupported()) {
    return null;
  }

  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const tokenData = await N.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync(SIREN_CHANNEL_ID, {
      name: "Task Siren Alerts",
      description: "Loud siren sound when a new task is assigned",
      importance: N.AndroidImportance.MAX,
      sound: SIREN_SOUND,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      enableVibrate: true,
      lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
    await N.setNotificationChannelAsync("default", {
      name: "Default",
      importance: N.AndroidImportance.HIGH,
    });
  }

  return token;
}

export interface SirenPushTarget {
  pushToken: string;
  taskId?: string;
}

export async function sendTaskSirenPush(
  targets: SirenPushTarget[],
  title: string,
  body: string
): Promise<void> {
  const messages = targets
    .filter((t) => !!t.pushToken)
    .map((t) => ({
      to: t.pushToken,
      title,
      body,
      sound: SIREN_SOUND,
      priority: "high" as const,
      channelId: SIREN_CHANNEL_ID,
      android: {
        channelId: SIREN_CHANNEL_ID,
        sound: SIREN_SOUND,
        priority: "max" as const,
        vibrate: [0, 500, 200, 500, 200, 500],
      },
      ios: {
        sound: SIREN_SOUND,
        _displayInForeground: true,
      },
      data: t.taskId ? { taskId: t.taskId, type: "new_task" } : { type: "new_task" },
    }));

  if (messages.length === 0) return;

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    throw new Error(`Push send failed with status ${res.status}`);
  }
}

const N = getNotifications();
if (N) {
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
