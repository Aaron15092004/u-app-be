import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getWorkoutProgramApi, startProgramApi } from "../../../../lib/api/workout-programs.api";
import type { IProgramDay } from "../../../../lib/api/types";
import {
  PRIMARY_DARK,
  PRIMARY_DEEP,
  BACKGROUND,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
  INACTIVE,
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,
} from "../../../../constants/colors";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  beginner:     { label: "Người mới",  color: DIFFICULTY_EASY },
  intermediate: { label: "Trung cấp",  color: DIFFICULTY_MEDIUM },
  advanced:     { label: "Nâng cao",   color: DIFFICULTY_HARD },
};

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}p ${s}s` : `${m} phút`;
}

// ─── Day card ─────────────────────────────────────────────────────────────────

interface DayCardProps {
  day: IProgramDay;
  isCompleted: boolean;
  isCurrent: boolean;
  onPress: () => void;
}

function DayCard({ day, isCompleted, isCurrent, onPress }: DayCardProps): React.JSX.Element {
  const canTap = isCompleted || isCurrent;
  return (
    <Pressable
      style={[daySt.card, isCurrent && daySt.cardCurrent]}
      onPress={canTap ? onPress : undefined}
      android_ripple={canTap ? { color: PRIMARY_DEEP + "18" } : undefined}
    >
      {/* Day number badge */}
      <View
        style={[
          daySt.dayNum,
          isCompleted && daySt.dayNumCompleted,
          isCurrent && daySt.dayNumCurrent,
        ]}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={16} color="#FFF" />
        ) : (
          <Text style={[daySt.dayNumText, isCurrent && { color: "#FFF" }]}>
            {day.dayNumber}
          </Text>
        )}
      </View>

      {/* Info */}
      <View style={daySt.info}>
        <Text style={daySt.title} numberOfLines={1}>
          {day.title}
        </Text>
        <Text style={daySt.meta}>
          {day.exercises.length} bài tập · {day.totalDurationMinutes} phút
        </Text>
      </View>

      {/* Right indicator */}
      {isCurrent && (
        <View style={daySt.currentBadge}>
          <Text style={daySt.currentBadgeText}>Hôm nay</Text>
        </View>
      )}
      {canTap && (
        <Ionicons name="chevron-forward" size={16} color={INACTIVE} style={daySt.chevron} />
      )}
    </Pressable>
  );
}

const daySt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCurrent: {
    borderWidth: 1.5,
    borderColor: PRIMARY_DARK,
  },
  dayNum: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PRIMARY_DEEP + "14",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dayNumCompleted: {
    backgroundColor: DIFFICULTY_EASY,
  },
  dayNumCurrent: {
    backgroundColor: PRIMARY_DARK,
  },
  dayNumText: {
    fontSize: 15,
    fontWeight: "700",
    color: PRIMARY_DEEP,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: TEXT },
  meta:  { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  currentBadge: {
    backgroundColor: PRIMARY_DARK + "1A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  currentBadgeText: { fontSize: 11, fontWeight: "600", color: PRIMARY_DARK },
  chevron: { marginLeft: 2 },
});

// ─── Header overlay (gradient over ImageBackground) ───────────────────────────

interface HeaderOverlayProps {
  programId: string;
  title: string;
  description?: string;
  level: string;
  totalDays: number;
  estimatedWeeks: number;
  avgMinutes: number;
  imageUrl?: string | null;
  paddingTop: number;
  onBack: () => void;
}

function HeaderOverlay({
  title,
  description,
  level,
  totalDays,
  estimatedWeeks,
  avgMinutes,
  imageUrl,
  paddingTop,
  onBack,
}: HeaderOverlayProps): React.JSX.Element {
  const levelCfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.beginner;

  const content = (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.72)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[hdrSt.gradient, { paddingTop: paddingTop + 12 }]}
    >
      <Pressable style={hdrSt.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </Pressable>

      <View style={hdrSt.content}>
        <View style={[hdrSt.levelBadge, { backgroundColor: levelCfg.color + "44" }]}>
          <Text style={hdrSt.levelText}>{levelCfg.label}</Text>
        </View>
        <Text style={hdrSt.title}>{title}</Text>
        {description ? (
          <Text style={hdrSt.desc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View style={hdrSt.statsRow}>
          {[
            { icon: "calendar-outline",  val: `${totalDays} ngày` },
            { icon: "time-outline",      val: `${estimatedWeeks} tuần` },
            { icon: "flame-outline",     val: `~${avgMinutes} phút/ngày` },
          ].map(({ icon, val }) => (
            <View key={val} style={hdrSt.statChip}>
              <Ionicons name={icon as never} size={13} color="rgba(255,255,255,0.85)" />
              <Text style={hdrSt.statChipText}>{val}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  if (imageUrl) {
    return (
      <ImageBackground
        source={{ uri: imageUrl }}
        style={hdrSt.imageBg}
        resizeMode="cover"
      >
        {content}
      </ImageBackground>
    );
  }

  return (
    <LinearGradient
      colors={[PRIMARY_DEEP, PRIMARY_DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={hdrSt.imageBg}
    >
      {/* Re-wrap so the inner gradient overlay still renders cleanly */}
      {content}
    </LinearGradient>
  );
}

const hdrSt = StyleSheet.create({
  imageBg: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  gradient: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  content: { gap: 6 },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  levelText:    { fontSize: 11, fontWeight: "600", color: "#FFF" },
  title:        { fontSize: 22, fontWeight: "700", color: "#FFF" },
  desc:         { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 18 },
  statsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statChipText: { fontSize: 12, color: "#FFF" },
});

// ─── CTA button label helper ──────────────────────────────────────────────────

function ctaLabel(
  progress: NonNullable<ReturnType<typeof getWorkoutProgramApi>> extends Promise<infer T>
    ? T extends { userProgress?: infer P } ? P : never
    : never,
): string {
  if (!progress) return "Bắt đầu chương trình";
  if (progress.status === "completed") return "Hoàn thành ✓";
  return `Tiếp tục Ngày ${progress.currentDay}`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgramDetailScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workout-program", id],
    queryFn: () => getWorkoutProgramApi(id),
    enabled: Boolean(id),
  });

  const startMutation = useMutation({
    mutationFn: () => startProgramApi(id),
    onSuccess: (progress) => {
      // Update the cache so userProgress is populated without a refetch round-trip
      queryClient.setQueryData(["workout-program", id], (old: typeof program) => {
        if (!old) return old;
        return { ...old, userProgress: progress };
      });
      void queryClient.invalidateQueries({ queryKey: ["workout-programs"] });
      router.push(
        `/(tabs)/exercises/session/${id}/${progress.currentDay}` as never,
      );
    },
    onError: () => {
      Alert.alert("Lỗi", "Không thể bắt đầu chương trình. Vui lòng thử lại.");
    },
  });

  // ── Derived values ──────────────────────────────────────────────────────────

  const progress = program?.userProgress ?? null;
  const completedDays = new Set(progress?.completedDays ?? []);
  const currentDay = progress?.currentDay ?? 1;
  const isCompleted = progress?.status === "completed";

  const avgMinutes =
    program && program.days.length > 0
      ? Math.round(
          program.days.reduce((s, d) => s + d.totalDurationMinutes, 0) /
            program.days.length,
        )
      : 0;

  // ── CTA handler ─────────────────────────────────────────────────────────────

  function handleCTA(): void {
    if (!program) return;
    if (isCompleted) return; // button is display-only when completed

    if (!progress) {
      startMutation.mutate();
      return;
    }

    // Active — go straight to the current day's session
    router.push(
      `/(tabs)/exercises/session/${id}/${currentDay}` as never,
    );
  }

  function handleDayPress(day: IProgramDay): void {
    router.push(
      `/(tabs)/exercises/session/${id}/${day.dayNumber}` as never,
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {isLoading || !program ? (
        // Skeleton header while loading
        <LinearGradient
          colors={[PRIMARY_DEEP, PRIMARY_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.skeletonHeader, { paddingTop: insets.top + 12 }]}
        >
          <Pressable style={hdrSt.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          {isLoading && (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </LinearGradient>
      ) : (
        <HeaderOverlay
          programId={id}
          title={program.title}
          description={program.description}
          level={program.level}
          totalDays={program.totalDays}
          estimatedWeeks={program.estimatedWeeks}
          avgMinutes={avgMinutes}
          imageUrl={program.imageUrl}
          paddingTop={insets.top}
          onBack={() => router.back()}
        />
      )}

      {/* ── Body ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_DARK} />
        </View>
      ) : isError || !program ? (
        <View style={styles.center}>
          <Text style={styles.errText}>Không thể tải chương trình.</Text>
          <Pressable style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Quay lại</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + 100 },
            ]}
          >
            <Text style={styles.sectionTitle}>
              Lịch tập ({program.days.length} ngày)
            </Text>
            {program.days.map((day) => {
              const done = completedDays.has(day.dayNumber);
              const current =
                !isCompleted && day.dayNumber === currentDay && progress !== null;
              return (
                <DayCard
                  key={day.dayNumber}
                  day={day}
                  isCompleted={done}
                  isCurrent={current}
                  onPress={() => handleDayPress(day)}
                />
              );
            })}
          </ScrollView>

          {/* ── Fixed CTA button ── */}
          <View
            style={[
              styles.ctaWrapper,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <Pressable
              style={[
                styles.ctaBtn,
                isCompleted && styles.ctaBtnCompleted,
                startMutation.isPending && styles.ctaBtnLoading,
              ]}
              onPress={handleCTA}
              disabled={isCompleted || startMutation.isPending}
            >
              {startMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.ctaBtnText}>
                  {isCompleted
                    ? "Hoàn thành ✓"
                    : progress
                    ? `Tiếp tục Ngày ${currentDay}`
                    : "Bắt đầu chương trình"}
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },

  skeletonHeader: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  loadingCenter: { alignItems: "center", paddingVertical: 32 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginTop: 24,
    marginBottom: 12,
  },
  scroll: { paddingHorizontal: 16 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errText: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 16 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: PRIMARY_DARK,
    borderRadius: 20,
  },
  retryText: { color: "#FFF", fontWeight: "600" },

  ctaWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: BACKGROUND,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaBtn: {
    backgroundColor: PRIMARY_DARK,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  ctaBtnCompleted: {
    backgroundColor: DIFFICULTY_EASY,
  },
  ctaBtnLoading: {
    opacity: 0.75,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
