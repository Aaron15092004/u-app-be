import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { IUserNotifications } from "../api/types";

const REMINDER_CHANNEL_ID = "daily-reminders";
const REMINDER_DATA_KEY = "uReminderType";

type ReminderType = "water" | "workout" | "nut_milk";

type ReminderConfig = {
  type: ReminderType;
  enabled: boolean;
  time: string;
  fallbackTime: string;
  title: string;
  body: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureLocalNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function configureReminderChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Nhắc nhở hằng ngày",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4CAF50",
  });
}

function parseTime(time: string, fallbackTime: string): { hour: number; minute: number } {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  const fallbackMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(fallbackTime);
  const safeMatch = match ?? fallbackMatch;

  return {
    hour: Number(safeMatch?.[1] ?? "8"),
    minute: Number(safeMatch?.[2] ?? "0"),
  };
}

async function cancelExistingReminderNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.[REMINDER_DATA_KEY])
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

export async function syncReminderNotifications(
  notifications: IUserNotifications,
  options: { requestPermission?: boolean } = {},
): Promise<void> {
  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.granted ||
    (options.requestPermission === true
      ? await ensureLocalNotificationPermission()
      : false);
  if (!granted) return;

  await configureReminderChannel();
  await cancelExistingReminderNotifications();

  const configs: ReminderConfig[] = [
    {
      type: "water",
      enabled: notifications.waterReminder,
      time: notifications.waterReminderTime,
      fallbackTime: "08:00",
      title: "Nhắc uống nước",
      body: "Đến giờ uống nước rồi. Uống một ly để giữ nhịp chăm sóc sức khỏe nhé.",
    },
    {
      type: "workout",
      enabled: notifications.workoutReminder,
      time: notifications.workoutReminderTime,
      fallbackTime: "07:00",
      title: "Nhắc tập luyện",
      body: "Đến giờ vận động. Bắt đầu bài tập hôm nay để giữ streak.",
    },
    {
      type: "nut_milk",
      enabled: notifications.nutMilkReminder,
      time: notifications.nutMilkReminderTime,
      fallbackTime: "20:00",
      title: "Nhắc uống sữa Ủ",
      body: "Đến giờ uống sữa Ủ theo lựa chọn phù hợp với thể trạng của bạn.",
    },
  ];

  await Promise.all(
    configs
      .filter((config) => config.enabled)
      .map((config) => {
        const { hour, minute } = parseTime(config.time, config.fallbackTime);

        return Notifications.scheduleNotificationAsync({
          content: {
            title: config.title,
            body: config.body,
            sound: "default",
            data: {
              [REMINDER_DATA_KEY]: config.type,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: REMINDER_CHANNEL_ID,
          },
        });
      }),
  );
}
