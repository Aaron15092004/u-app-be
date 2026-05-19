import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import NotifToggleRow from '../../../components/ui/NotifToggleRow';
import NotifTimeRow from '../../../components/ui/NotifTimeRow';
import NotificationRationaleModal from '../../../components/ui/NotificationRationaleModal';
import { updateNotificationsApi, getProfileStatsApi } from '../../../lib/api/users.api';
import { getNotifAsked, setNotifAsked } from '../../../lib/storage/mmkv';
import { TEXT_SECONDARY, SURFACE } from '../../../constants/colors';

export default function NotificationSettingsScreen(): React.JSX.Element {
  const qc = useQueryClient();

  // WARNING 3 FIX: initialise form state from server, not hardcoded defaults
  const profileStatsQuery = useQuery({
    queryKey: ['users', 'profile', 'stats'],
    queryFn: getProfileStatsApi,
  });
  const serverNotif = profileStatsQuery.data?.notifications;

  const [waterReminder, setWaterReminder] = useState<boolean | null>(null);
  const [workoutReminder, setWorkoutReminder] = useState<boolean | null>(null);
  const [waterReminderTime, setWaterReminderTime] = useState<string | null>(null);
  const [workoutReminderTime, setWorkoutReminderTime] = useState<string | null>(null);

  // Seed local form state once the server data arrives — and only once (don't overwrite user-in-progress edits)
  useEffect(() => {
    if (serverNotif && waterReminder === null) {
      setWaterReminder(serverNotif.waterReminder);
      setWorkoutReminder(serverNotif.workoutReminder);
      setWaterReminderTime(serverNotif.waterReminderTime);
      setWorkoutReminderTime(serverNotif.workoutReminderTime);
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users', 'profile', 'stats'] });
    },
  });

  // Debounce timer for time PATCH (800ms per Pitfall 7)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedMutate = (body: Parameters<typeof updateNotificationsApi>[0]): void => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      mutation.mutate(body);
    }, 800);
  };

  const handleAccept = async (): Promise<void> => {
    setNotifAsked(true);
    setShowRationale(false);
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
          <ScreenHeader title="Cài đặt thông báo" showBack />
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
        <ScreenHeader title="Cài đặt thông báo" showBack />

        <View style={styles.card}>
          {/* Water reminder toggle */}
          <NotifToggleRow
            label="Nhắc uống nước"
            sublabel="Nhắc bạn uống nước mỗi ngày"
            value={waterReminder ?? false}
            onChange={(v) => {
              setWaterReminder(v);
              mutation.mutate({ waterReminder: v });
            }}
          />

          {/* Conditional water time row */}
          {waterReminder === true && (
            <>
              <View style={styles.separator} />
              <NotifTimeRow
                label="Giờ nhắc uống nước"
                sublabel={waterReminderTime ?? '08:00'}
                time={waterReminderTime ?? '08:00'}
                onTimeChange={(newTime) => {
                  setWaterReminderTime(newTime);
                  debouncedMutate({ waterReminderTime: newTime });
                }}
              />
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
                sublabel={workoutReminderTime ?? '07:00'}
                time={workoutReminderTime ?? '07:00'}
                onTimeChange={(newTime) => {
                  setWorkoutReminderTime(newTime);
                  debouncedMutate({ workoutReminderTime: newTime });
                }}
              />
            </>
          )}
        </View>

        {/* Info text */}
        <Text style={styles.infoText}>
          Streak alert sẽ tự động gửi lúc 20:00 mỗi ngày nếu bạn chưa hoàn thành thói quen.
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
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  loadingContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
});
