import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Alert,
  AppState,
  type AppStateStatus,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getWorkoutProgramApi } from "../../../../../lib/api/workout-programs.api";
import { createSessionApi, completeSessionApi, abandonSessionApi } from "../../../../../lib/api/workout-sessions.api";
import { useWorkoutSessionStore } from "../../../../../stores/workoutSessionStore";
import {
  TIMER_BG,
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,
  INACTIVE,
} from "../../../../../constants/colors";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, string> = {
  yoga:       "body-outline",
  cardio:     "bicycle-outline",
  weights:    "barbell-outline",
  stretching: "fitness-outline",
};

const CATEGORY_COLOR: Record<string, string> = {
  yoga:       "#7C4DFF",
  cardio:     "#FF5722",
  weights:    "#2196F3",
  stretching: "#4CAF50",
};

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  current, total, phase, duration,
}: {
  current: number; total: number; phase: string; duration: number;
}): React.JSX.Element {
  const progress = Math.max(0, Math.min(1, current / Math.max(1, total)));
  return (
    <View style={pbarSt.track}>
      <View style={[pbarSt.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const pbarSt = StyleSheet.create({
  track: { height: 3, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 2, overflow: "hidden" },
  fill:  { height: 3, backgroundColor: "#FFF", borderRadius: 2 },
});

// ─── Completion overlay ───────────────────────────────────────────────────────

function CompletionOverlay({
  dayTitle, exerciseCount, durationSeconds, onDone,
}: {
  dayTitle: string; exerciseCount: number; durationSeconds: number; onDone: () => void;
}): React.JSX.Element {
  const mins = Math.ceil(durationSeconds / 60);
  return (
    <View style={compSt.overlay}>
      <View style={compSt.card}>
        <View style={compSt.iconWrap}>
          <Ionicons name="trophy" size={48} color="#FFC107" />
        </View>
        <Text style={compSt.title}>Hoàn thành!</Text>
        <Text style={compSt.sub}>{dayTitle}</Text>
        <View style={compSt.statsRow}>
          <View style={compSt.statBox}>
            <Text style={compSt.statNum}>{exerciseCount}</Text>
            <Text style={compSt.statLbl}>Bài tập</Text>
          </View>
          <View style={compSt.divider} />
          <View style={compSt.statBox}>
            <Text style={compSt.statNum}>{mins}</Text>
            <Text style={compSt.statLbl}>Phút</Text>
          </View>
        </View>
        <Pressable style={compSt.btn} onPress={onDone}>
          <Text style={compSt.btnText}>Tuyệt vời!</Text>
        </Pressable>
      </View>
    </View>
  );
}

const compSt = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 32,
    width: "80%",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#FFF9E6",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  title:   { fontSize: 24, fontWeight: "700", color: "#212121" },
  sub:     { fontSize: 14, color: "#757575", textAlign: "center" },
  statsRow:{ flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 16 },
  statBox: { alignItems: "center", flex: 1 },
  statNum: { fontSize: 28, fontWeight: "700", color: "#212121" },
  statLbl: { fontSize: 12, color: "#757575", marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: "#E0E0E0" },
  btn: {
    backgroundColor: TIMER_BG,
    borderRadius: 14,
    paddingHorizontal: 40, paddingVertical: 14,
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WorkoutSessionScreen(): React.JSX.Element {
  const insets     = useSafeAreaInsets();
  const router     = useRouter();
  const qc         = useQueryClient();
  const { programId, day } = useLocalSearchParams<{ programId: string; day: string }>();
  const dayNumber  = parseInt(day, 10);

  const store = useWorkoutSessionStore();
  const sessionInitRef  = useRef(false);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeSentRef = useRef(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Load program day ──
  const { data: program } = useQuery({
    queryKey: ["workout-program", programId],
    queryFn:  () => getWorkoutProgramApi(programId),
    enabled:  Boolean(programId),
  });

  const programDay = program?.days.find((d) => d.dayNumber === dayNumber) ?? null;

  // ── Init session once ──
  useEffect(() => {
    if (!programDay || sessionInitRef.current) return;
    sessionInitRef.current = true;

    const exercises = programDay.exercises.map((e) => ({
      name:            e.exerciseName,
      category:        e.category,
      durationSeconds: e.durationSeconds,
      restSeconds:     e.restSeconds,
      order:           e.order,
      imageUrl:        e.imageUrl ?? null,
    }));

    void createSessionApi({
      programId,
      dayNumber,
      dayTitle: programDay.title,
      exercises,
    }).then((session) => {
      store.startSession({
        sessionId: session._id,
        programId,
        dayNumber,
        dayTitle: programDay.title,
        exercises,
      });
    });
  }, [programDay, programId, dayNumber, store]);

  // ── Tick loop ──
  const tick = useCallback(() => {
    store.tick();
    setElapsedSeconds((s) => s + 1);
  }, [store]);

  useEffect(() => {
    if (store.isActive && !store.isPaused && store.phase !== "completed") {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [store.isActive, store.isPaused, store.phase, tick]);

  // ── Auto-pause on background ──
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "background" && store.isActive && !store.isPaused) {
        store.pause();
      }
    });
    return () => sub.remove();
  }, [store]);

  // ── Handle phase = completed ──
  useEffect(() => {
    if (store.phase === "completed" && !completeSentRef.current && store.sessionId) {
      completeSentRef.current = true;
      const sessionId = store.sessionId;
      const duration  = elapsedSeconds;

      void completeSessionApi(sessionId, duration).then(() => {
        void qc.invalidateQueries({ queryKey: ["workout-programs"] });
        void qc.invalidateQueries({ queryKey: ["workout-sessions", "streak"] });
        void qc.invalidateQueries({ queryKey: ["workouts", "stats", "weekly"] });
      });

      setShowCompletion(true);
    }
  }, [store.phase, store.sessionId, elapsedSeconds, qc]);

  // ── Abandon / Stop ──
  const handleStop = useCallback((): void => {
    Alert.alert(
      "Dừng buổi tập?",
      "Tiến trình sẽ không được lưu.",
      [
        { text: "Tiếp tục tập", style: "cancel" },
        {
          text: "Dừng lại",
          style: "destructive",
          onPress: () => {
            if (store.sessionId) {
              void abandonSessionApi(store.sessionId);
            }
            store.reset();
            router.back();
          },
        },
      ]
    );
  }, [store, router]);

  const handleDone = useCallback((): void => {
    store.reset();
    router.replace("/(tabs)/exercises" as never);
  }, [store, router]);

  // ── Current exercise info ──
  const currentEx  = store.exercises[store.currentIndex];
  const nextEx     = store.exercises[store.currentIndex + 1];
  const iconName   = CATEGORY_ICON[currentEx?.category ?? ""] ?? "fitness-outline";
  const iconColor  = CATEGORY_COLOR[currentEx?.category ?? ""] ?? INACTIVE;
  const totalExs   = store.exercises.length;

  const isRest       = store.phase === "rest";
  const phaseColor   = isRest ? "#1E88E5" : "#43A047";
  const phaseLabel   = isRest ? "NGHỈ NGƠI" : "ĐANG TẬP";

  // Loading state
  if (!store.isActive || !currentEx) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: "#FFF", fontSize: 16 }}>Đang chuẩn bị...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Completion overlay */}
      {showCompletion && (
        <CompletionOverlay
          dayTitle={store.dayTitle}
          exerciseCount={totalExs}
          durationSeconds={elapsedSeconds}
          onDone={handleDone}
        />
      )}

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.stopBtn} onPress={handleStop}>
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{store.dayTitle}</Text>
          <Text style={styles.headerSub}>
            {store.currentIndex + 1} / {totalExs} bài tập
          </Text>
        </View>

        <View style={styles.elapsedBox}>
          <Text style={styles.elapsedText}>{fmtTime(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <ProgressBar
        current={store.currentIndex}
        total={totalExs}
        phase={store.phase}
        duration={store.timeRemaining}
      />

      {/* ── Exercise card ── */}
      <View style={styles.body}>
        {/* Phase badge */}
        <View style={[styles.phaseBadge, { backgroundColor: phaseColor }]}>
          <Text style={styles.phaseLabel}>{phaseLabel}</Text>
        </View>

        {/* Exercise image or category icon */}
        <View style={[styles.iconCircle, { backgroundColor: iconColor + "22", overflow: "hidden" }]}>
          {currentEx.imageUrl ? (
            <Image
              source={{ uri: currentEx.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name={iconName as never} size={52} color={iconColor} />
          )}
        </View>

        {/* Exercise name */}
        <Text style={styles.exerciseName} numberOfLines={2}>
          {isRest ? (nextEx?.name ?? "Bài tập tiếp theo") : currentEx.name}
        </Text>

        {isRest && nextEx && (
          <Text style={styles.nextHint}>Tiếp theo: {nextEx.name}</Text>
        )}

        {/* Big timer */}
        <Text style={styles.timerDigits}>{fmtTime(store.timeRemaining)}</Text>

        {/* Dots progress */}
        <View style={styles.dotsRow}>
          {store.exercises.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < store.currentIndex && styles.dotDone,
                i === store.currentIndex && styles.dotCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      {/* ── Controls ── */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.ctrlBtn} onPress={handleStop}>
          <Ionicons name="stop-outline" size={26} color="rgba(255,255,255,0.7)" />
          <Text style={styles.ctrlLabel}>Dừng</Text>
        </Pressable>

        <Pressable
          style={styles.ctrlBtnLarge}
          onPress={store.isPaused ? store.resume : store.pause}
        >
          <Ionicons
            name={store.isPaused ? "play" : "pause"}
            size={32}
            color="#FFF"
          />
        </Pressable>

        <Pressable style={styles.ctrlBtn} onPress={store.skipCurrent}>
          <Ionicons name="play-skip-forward-outline" size={26} color="rgba(255,255,255,0.7)" />
          <Text style={styles.ctrlLabel}>Bỏ qua</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TIMER_BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  stopBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 15, fontWeight: "700", color: "#FFF" },
  headerSub:    { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  elapsedBox: {
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  elapsedText: { fontSize: 13, fontWeight: "600", color: "#FFF" },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },

  phaseBadge: {
    paddingHorizontal: 16, paddingVertical: 5,
    borderRadius: 20, marginBottom: 4,
  },
  phaseLabel: { fontSize: 12, fontWeight: "700", color: "#FFF", letterSpacing: 1 },

  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: "center", justifyContent: "center",
    marginVertical: 4,
  },

  exerciseName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 30,
  },
  nextHint: {
    fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center",
  },

  timerDigits: {
    fontSize: 72,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 2,
    marginVertical: 4,
  },

  dotsRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotDone:    { backgroundColor: "rgba(255,255,255,0.6)" },
  dotCurrent: { backgroundColor: "#FFF", width: 20, borderRadius: 4 },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 32,
    paddingTop: 16,
  },
  ctrlBtn: { alignItems: "center", gap: 4, opacity: 0.85 },
  ctrlLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  ctrlBtnLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center", justifyContent: "center",
  },
});
