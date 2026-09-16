import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const SIREN_CHANNEL_ID = "task-siren";
export const SIREN_SOUND = "siren.wav";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(SIREN_CHANNEL_ID, {
      name: "Task Siren Alerts",
      description: "Loud siren sound when a new task is assigned",
      importance: Notifications.AndroidImportance.MAX,
      sound: SIREN_SOUND,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
