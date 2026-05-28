import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ScreenHeader from "../../../components/ui/ScreenHeader";
import NotifToggleRow from "../../../components/ui/NotifToggleRow";
import NotifTimeRow from "../../../components/ui/NotifTimeRow";
import NotificationRationaleModal from "../../../components/ui/NotificationRationaleModal";
import {
  updateNotificationsApi,
  getProfileStatsApi,
} from "../../../lib/api/users.api";
import { getNotifAsked, setNotifAsked } from "../../../lib/storage/mmkv";
import { syncReminderNotifications } from "../../../lib/notifications/reminders";
import { TEXT_SECONDARY, SURFACE } from "../../../constants/colors";

const DEFAULT_WATER_REMINDER_TIMES = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];

export default function NotificationSettingsScreen(): React.JSX.Element {
  const qc = useQueryClient();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const handleBack = (): void => {
    if (returnTo === "profile") {
      router.replace("/(tabs)/profile" as never);
      return;
    }
    router.back();
  };

  // WARNING 3 FIX: initialise form state from server, not hardcoded defaults
  const profileStatsQuery = useQuery({
    queryKey: ["users", "profile", "stats"],
    queryFn: getProfileStatsApi,
  });
  const serverNotif = profileStatsQuery.data?.notifications;

  const [waterReminder, setWaterReminder] = useState<boolean | null>(null);
  const [workoutReminder, setWorkoutReminder] = useState<boolean | null>(null);
  const [nutMilkReminder, setNutMilkReminder] = useState<boolean | null>(null);
  const [waterReminderTimes, setWaterReminderTimes] = useState<string[] | null>(
    null,
  );
  const [workoutReminderTime, setWorkoutReminderTime] = useState<string | null>(
    null,
  );
  const [nutMilkReminderTime, setNutMilkReminderTime] = useState<string | null>(
    null,
  );

  // Seed local form state once the server data arrives — and only once (don't overwrite user-in-progress edits)
  useEffect(() => {
    if (serverNotif && waterReminder === null) {
      setWaterReminder(serverNotif.waterReminder);
      setWorkoutReminder(serverNotif.workoutReminder);
      setNutMilkReminder(serverNotif.nutMilkReminder);
      setWaterReminderTimes(
        serverNotif.waterReminderTimes?.length > 0
          ? serverNotif.waterReminderTimes
          : DEFAULT_WATER_REMINDER_TIMES,
      );
      setWorkoutReminderTime(serverNotif.workoutReminderTime);
      setNutMilkReminderTime(serverNotif.nutMilkReminderTime);
      void syncReminderNotifications(serverNotif).catch((err) => {
        console.warn("[notifications] sync reminders failed:", err);
      });
    }
  }, [serverNotif, waterReminder]);

  // Rationale modal — shown once via MMKV flag
  const [showRationale, setShowRationale] = useState(false);
  useEffect(() => {
    if (!getNotifAsked()) {
      setShowRationale(true);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: updateNotificationsApi,
    onSuccess: ({ notifications }) => {
      void syncReminderNotifications(notifications, { requestPermission: true }).catch((err) => {
        console.warn("[notifications] sync reminders failed:", err);
      });
      void qc.invalidateQueries({ queryKey: ["users", "profile", "stats"] });
    },
  });

  // Debounce timer for time PATCH (800ms per Pitfall 7)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedMutate = (
    body: Parameters<typeof updateNotificationsApi>[0],
  ): void => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      mutation.mutate(body);
    }, 800);
  };

  const updateWaterReminderTime = (index: number, newTime: string): void => {
    const nextTimes = [...(waterReminderTimes ?? DEFAULT_WATER_REMINDER_TIMES)];
    nextTimes[index] = newTime;
    setWaterReminderTimes(nextTimes);
    debouncedMutate({ waterReminderTimes: nextTimes });
  };

  const handleAccept = async (): Promise<void> => {
    setNotifAsked(true);
    setShowRationale(false);
    if (serverNotif) {
      await syncReminderNotifications(serverNotif);
    }
  };

  const handleDismiss = (): void => {
    setNotifAsked(true);
    setShowRationale(false);
  };

  // Loading guard — wait for first server seed before rendering toggles
  if (waterReminder === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScreenHeader title="Cài đặt thông báo" showBack onBack={handleBack} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#4CAF50" size="small" />
          </View>
        </ScrollView>
        <NotificationRationaleModal
          visible={showRationale}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Cài đặt thông báo" showBack onBack={handleBack} />

        <View style={styles.card}>
          {/* Water reminder toggle */}
          <NotifToggleRow
            label="Nhắc uống nước"
            sublabel="Mặc định 8 lần/ngày, có thể chỉnh từng mốc"
            value={waterReminder ?? false}
            onChange={(v) => {
              setWaterReminder(v);
              mutation.mutate({ waterReminder: v });
            }}
          />

          {waterReminder === true && (
            <>
              {(waterReminderTimes ?? DEFAULT_WATER_REMINDER_TIMES).map(
                (time, index) => (
                  <React.Fragment key={`water-${index}`}>
                    <View style={styles.separator} />
                    <NotifTimeRow
                      label={`Uống nước lần ${index + 1}`}
                      sublabel={time}
                      time={time}
                      onTimeChange={(newTime) => {
                        updateWaterReminderTime(index, newTime);
                      }}
                    />
                  </React.Fragment>
                ),
              )}
            </>
          )}

          <View style={styles.separator} />

          {/* Workout reminder toggle */}
          <NotifToggleRow
            label="Nhắc tập luyện"
            sublabel="Nhắc bạn bắt đầu tập mỗi ngày"
            value={workoutReminder ?? false}
            onChange={(v) => {
              setWorkoutReminder(v);
              mutation.mutate({ workoutReminder: v });
            }}
          />

          {/* Conditional workout time row */}
          {workoutReminder === true && (
            <>
              <View style={styles.separator} />
              <NotifTimeRow
                label="Giờ nhắc tập luyện"
                sublabel={workoutReminderTime ?? "07:00"}
                time={workoutReminderTime ?? "07:00"}
                onTimeChange={(newTime) => {
                  setWorkoutReminderTime(newTime);
                  debouncedMutate({ workoutReminderTime: newTime });
                }}
              />
            </>
          )}

          <View style={styles.separator} />

          <NotifToggleRow
            label="Nhắc uống sữa Ủ"
            sublabel="Nhắc bạn uống sữa hạt theo lịch đã chọn"
            value={nutMilkReminder ?? false}
            onChange={(v) => {
              setNutMilkReminder(v);
              mutation.mutate({ nutMilkReminder: v });
            }}
          />

          {nutMilkReminder === true && (
            <>
              <View style={styles.separator} />
              <NotifTimeRow
                label="Giờ nhắc uống sữa Ủ"
                sublabel={nutMilkReminderTime ?? "20:00"}
                time={nutMilkReminderTime ?? "20:00"}
                onTimeChange={(newTime) => {
                  setNutMilkReminderTime(newTime);
                  debouncedMutate({ nutMilkReminderTime: newTime });
                }}
              />
            </>
          )}
        </View>

        {/* Info text */}
        <Text style={styles.infoText}>
          App sẽ lên lịch lại nhắc nhở trên máy sau mỗi lần bạn thay đổi cài
          đặt.
        </Text>
      </ScrollView>

      <NotificationRationaleModal
        visible={showRationale}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  loadingContainer: {
    marginTop: 48,
    alignItems: "center",
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 16,
    textAlign: "center",
  },
});
