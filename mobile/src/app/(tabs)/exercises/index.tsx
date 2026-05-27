import React, { useState } from "react";
import {
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
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { listWorkoutProgramsApi } from "../../../lib/api/workout-programs.api";
import { getWorkoutStreakApi } from "../../../lib/api/workout-sessions.api";
import { useWorkoutSessionStore } from "../../../stores/workoutSessionStore";
import type { IWorkoutProgramSummary } from "../../../lib/api/types";
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
  TIMER_BG,
} from "../../../constants/colors";

// ─── Constants ────────────────────────────────────────────────────────────────

type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";

const LEVEL_CHIPS: { id: LevelFilter; label: string }[] = [
  { id: "all",          label: "Tất cả" },
  { id: "beginner",     label: "Người mới" },
  { id: "intermediate", label: "Trung cấp" },
  { id: "advanced",     label: "Nâng cao" },
];

const LEVEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  beginner:     { label: "Người mới",  color: DIFFICULTY_EASY,   icon: "leaf-outline" },
  intermediate: { label: "Trung cấp",  color: DIFFICULTY_MEDIUM, icon: "flame-outline" },
  advanced:     { label: "Nâng cao",   color: DIFFICULTY_HARD,   icon: "trophy-outline" },
};

// ─── Resume banner ────────────────────────────────────────────────────────────

function ResumeBanner({
  dayTitle, programId, dayNumber, onPress,
}: {
  dayTitle: string; programId: string | null; dayNumber: number | null; onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [resumeSt.card, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      <View style={resumeSt.iconWrap}>
        <Ionicons name="play-circle" size={28} color="#FFF" />
      </View>
      <View style={resumeSt.mid}>
        <Text style={resumeSt.label}>Đang tập dang dở</Text>
        <Text style={resumeSt.sub} numberOfLines={1}>{dayTitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

const resumeSt = StyleSheet.create({
  card: {
    backgroundColor: TIMER_BG,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 4,
    shadowColor: TIMER_BG,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  mid:   { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  sub:   { fontSize: 14, fontWeight: "700", color: "#FFF" },
});

// ─── Program card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program, onPress,
}: {
  program: IWorkoutProgramSummary; onPress: () => void;
}): React.JSX.Element {
  const cfg      = LEVEL_CONFIG[program.level] ?? LEVEL_CONFIG.beginner;
  const progress = program.userProgress;
  const hasImage = Boolean(program.imageUrl);

  const cardContent = (
    <LinearGradient
      colors={hasImage
        ? ["transparent", "rgba(0,0,0,0.68)"]
        : [PRIMARY_DEEP + "CC", PRIMARY_DARK + "EE"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={cardSt.gradient}
    >
      {/* Level badge */}
      <View style={[cardSt.badge, { backgroundColor: cfg.color + "33" }]}>
        <Ionicons name={cfg.icon as never} size={11} color="#FFF" />
        <Text style={cardSt.badgeText}>{cfg.label}</Text>
      </View>

      <View style={cardSt.bottom}>
        <Text style={cardSt.title} numberOfLines={2}>{program.title}</Text>
        {program.description ? (
          <Text style={cardSt.desc} numberOfLines={1}>{program.description}</Text>
        ) : null}

        {/* Stats row */}
        <View style={cardSt.statsRow}>
          <View style={cardSt.statChip}>
            <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.8)" />
            <Text style={cardSt.statText}>{program.totalDays} ngày</Text>
          </View>
          <View style={cardSt.statChip}>
            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
            <Text style={cardSt.statText}>~{program.avgDayMinutes} phút/ngày</Text>
          </View>
        </View>

        {/* Progress bar (if enrolled) */}
        {progress && program.totalDays > 0 && (
          <View style={cardSt.progressWrap}>
            <View style={cardSt.progressTrack}>
              <View
                style={[
                  cardSt.progressFill,
                  { width: `${Math.round((progress.completedDays.length / program.totalDays) * 100)}%` },
                ]}
              />
            </View>
            <Text style={cardSt.progressText}>
              {progress.completedDays.length}/{program.totalDays}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  if (hasImage && program.imageUrl) {
    return (
      <Pressable
        style={({ pressed }) => [cardSt.card, pressed && { opacity: 0.95 }]}
        onPress={onPress}
      >
        <ImageBackground
          source={{ uri: program.imageUrl }}
          style={cardSt.imageBg}
          imageStyle={cardSt.imageStyle}
          resizeMode="cover"
        >
          {cardContent}
        </ImageBackground>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [cardSt.card, pressed && { opacity: 0.95 }]}
      onPress={onPress}
    >
      <View style={cardSt.imageBg}>{cardContent}</View>
    </Pressable>
  );
}

const cardSt = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imageBg:    { width: "100%", height: 180 },
  imageStyle: { borderRadius: 18 },
  gradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#FFF" },
  bottom:    { gap: 6 },
  title:     { fontSize: 18, fontWeight: "700", color: "#FFF", lineHeight: 22 },
  desc:      { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  statsRow:  { flexDirection: "row", gap: 8, marginTop: 2 },
  statChip:  { flexDirection: "row", alignItems: "center", gap: 3 },
  statText:  { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2, overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: "#FFF", borderRadius: 2 },
  progressText: { fontSize: 11, color: "rgba(255,255,255,0.75)", minWidth: 28 },
});

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }): React.JSX.Element {
  return <Text style={secSt.t}>{title}</Text>;
}
const secSt = StyleSheet.create({
  t: { fontSize: 16, fontWeight: "700", color: TEXT, marginTop: 20, marginBottom: 10 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExerciseListScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const store = useWorkoutSessionStore();

  const streakQ = useQuery({
    queryKey: ["workout-sessions", "streak"],
    queryFn:  getWorkoutStreakApi,
  });

  const programsQ = useQuery({
    queryKey: ["workout-programs", levelFilter],
    queryFn:  () => listWorkoutProgramsApi(levelFilter === "all" ? undefined : levelFilter),
  });

  const streak = streakQ.data?.currentStreak ?? 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[PRIMARY_DEEP, PRIMARY_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Luyện tập</Text>
            <Text style={styles.headerSub}>Kiên trì mỗi ngày, kết quả đến tự nhiên</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLbl}>ngày</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Resume banner */}
        {store.isActive && store.sessionId && (
          <>
            <SectionTitle title="Đang tập" />
            <ResumeBanner
              dayTitle={store.dayTitle}
              programId={store.programId}
              dayNumber={store.dayNumber}
              onPress={() => {
                if (store.programId && store.dayNumber != null) {
                  router.push(`/(tabs)/exercises/session/${store.programId}/${store.dayNumber}` as never);
                }
              }}
            />
          </>
        )}

        {/* My programs (enrolled) */}
        {programsQ.data?.some((p) => p.userProgress?.status === "active") && (
          <>
            <SectionTitle title="Chương trình của tôi" />
            {programsQ.data
              .filter((p) => p.userProgress?.status === "active")
              .map((prog) => (
                <ProgramCard
                  key={String(prog._id)}
                  program={prog}
                  onPress={() => router.push(`/(tabs)/exercises/program/${String(prog._id)}` as never)}
                />
              ))}
          </>
        )}

        {/* Discover programs */}
        <SectionTitle title="Khám phá chương trình" />

        {/* Level filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {LEVEL_CHIPS.map((chip) => (
            <Pressable
              key={chip.id}
              style={[styles.chip, levelFilter === chip.id && styles.chipActive]}
              onPress={() => setLevelFilter(chip.id)}
            >
              <Text style={[styles.chipText, levelFilter === chip.id && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {programsQ.isLoading ? (
          <>
            {[1, 2, 3].map((k) => <View key={k} style={styles.skeleton} />)}
          </>
        ) : programsQ.data?.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có chương trình nào.</Text>
          </View>
        ) : (
          programsQ.data?.map((prog) => (
            <ProgramCard
              key={String(prog._id)}
              program={prog}
              onPress={() => router.push(`/(tabs)/exercises/program/${String(prog._id)}` as never)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerGreeting: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  headerSub:      { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 },

  streakBadge: {
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row", gap: 4,
  },
  streakFire: { fontSize: 18 },
  streakNum:  { fontSize: 20, fontWeight: "700", color: "#FFF" },
  streakLbl:  { fontSize: 11, color: "rgba(255,255,255,0.75)" },

  scroll: { paddingHorizontal: 16 },

  chipsScroll:  { marginBottom: 12 },
  chipsContent: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#F0F0F0",
  },
  chipActive:     { backgroundColor: PRIMARY_DARK },
  chipText:       { fontSize: 13, fontWeight: "500", color: TEXT_SECONDARY },
  chipTextActive: { color: "#FFF", fontWeight: "600" },

  skeleton: {
    height: 180, backgroundColor: "#F0F0F0",
    borderRadius: 18, marginBottom: 12,
  },
  emptyBox:  { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontSize: 14, color: TEXT_SECONDARY },
});
