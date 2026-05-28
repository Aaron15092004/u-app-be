import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../providers/AuthProvider";
import { getProfileStatsApi } from "../../../lib/api/users.api";
import { getWorkoutStreakApi } from "../../../lib/api/workout-sessions.api";
import {
  getNutMilkRecommendationsApi,
  getRatingPromptStatusApi,
  getScanEntitlementsApi,
  selectNutMilkFlavorApi,
} from "../../../lib/api/v2-contracts.api";
import RedeemCodeCard from "../../../components/ui/RedeemCodeCard";
import ScanEntitlementBadge from "../../../components/ui/ScanEntitlementBadge";
import AppRatingPrompt from "../../../components/ui/AppRatingPrompt";
import type { IV2ScanEntitlementStatus } from "../../../lib/api/types";
import {
  PRIMARY,
  PRIMARY_DEEP,
  PRIMARY_DARK,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
  INACTIVE,
  STREAK_BADGE,
} from "../../../constants/colors";

// ─── Milestone config ─────────────────────────────────────────────────────────

const MILESTONES: { days: number; icon: string }[] = [
  { days: 7, icon: "trending-up-outline" },
  { days: 14, icon: "ribbon-outline" },
  { days: 28, icon: "medal-outline" },
  { days: 60, icon: "trophy-outline" },
];

const GOAL_LABEL: Record<string, string> = {
  lose: "Giảm cân",
  maintain: "Giữ cân nặng",
  gain: "Tăng cân",
};

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  action,
  onAction,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
  last?: boolean;
}): React.JSX.Element {
  return (
    <View style={[infoSt.row, last && { borderBottomWidth: 0 }]}>
      <Ionicons
        name={icon as never}
        size={18}
        color={TEXT_SECONDARY}
        style={infoSt.icon}
      />
      <View style={infoSt.mid}>
        <Text style={infoSt.lbl}>{label}</Text>
        <Text style={infoSt.val}>{value}</Text>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={infoSt.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const infoSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  icon: { marginRight: 12 },
  mid: { flex: 1 },
  lbl: { fontSize: 11, color: TEXT_SECONDARY, marginBottom: 1 },
  val: { fontSize: 14, fontWeight: "500", color: TEXT },
  action: { fontSize: 13, fontWeight: "600", color: PRIMARY_DARK },
});

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  onPress,
  danger,
  last,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        settSt.row,
        last && { borderBottomWidth: 0 },
        pressed && { backgroundColor: "#F8F8F8" },
      ]}
    >
      <Ionicons
        name={icon as never}
        size={20}
        color={danger ? "#EF5350" : TEXT_SECONDARY}
        style={settSt.icon}
      />
      <Text style={[settSt.label, danger && { color: "#EF5350" }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={INACTIVE} />
    </Pressable>
  );
}

const settSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  icon: { marginRight: 12 },
  label: { flex: 1, fontSize: 15, color: TEXT },
});

// ─── Milestone badge ──────────────────────────────────────────────────────────

function MilestoneBadge({
  days,
  icon,
  state,
}: {
  days: number;
  icon: string;
  state: "active" | "done" | "locked";
}): React.JSX.Element {
  const isActive = state === "active";
  const isDone = state === "done";
  return (
    <View style={badgeSt.col}>
      <View
        style={[
          badgeSt.circle,
          isActive && badgeSt.circleActive,
          isDone && badgeSt.circleDone,
          state === "locked" && badgeSt.circleLocked,
        ]}
      >
        <Ionicons
          name={icon as never}
          size={22}
          color={isActive ? "#FFF" : isDone ? STREAK_BADGE : INACTIVE}
        />
      </View>
      <Text
        style={[badgeSt.label, (isActive || isDone) && { color: STREAK_BADGE }]}
      >
        {days} ngày
      </Text>
    </View>
  );
}

const badgeSt = StyleSheet.create({
  col: { alignItems: "center", flex: 1 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  circleActive: { backgroundColor: STREAK_BADGE },
  circleDone: { backgroundColor: "transparent" },
  circleLocked: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: INACTIVE,
  },
  label: { fontSize: 11, fontWeight: "600", color: INACTIVE, marginTop: 6 },
});

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}): React.JSX.Element {
  return <View style={[cardSt.card, style]}>{children}</View>;
}

const cardSt = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
});

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }): React.JSX.Element {
  return <Text style={secSt.t}>{title}</Text>;
}
const secSt = StyleSheet.create({
  t: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginTop: 24,
    marginBottom: 10,
  },
});

function ScanAccountBanner({
  status,
  loading,
}: {
  status?: IV2ScanEntitlementStatus;
  loading: boolean;
}): React.JSX.Element {
  const active = status?.hasActiveEntitlement === true;
  const dailyLimit = status?.quotaPolicy?.dailyLimit ?? 2;
  const activeUntil = status?.activeUntil
    ? new Date(status.activeUntil).toLocaleDateString("vi-VN")
    : null;

  return (
    <LinearGradient
      colors={active ? ["#F0F8D9", "#E1F0B5"] : ["#FFF7ED", "#FFE7C2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.scanBanner,
        active ? styles.scanBannerActive : styles.scanBannerInactive,
      ]}
    >
      <View style={styles.scanBannerIcon}>
        <Ionicons
          name={active ? "sparkles-outline" : "lock-open-outline"}
          size={22}
          color={active ? PRIMARY_DARK : STREAK_BADGE}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.scanBannerTitle}>
          {loading
            ? "Đang kiểm tra gói scan"
            : active
              ? "Tài khoản scan AI đang active"
              : "Tài khoản scan AI chưa active"}
        </Text>
        <Text style={styles.scanBannerCopy}>
          {active
            ? `${dailyLimit} lượt scan AI mỗi ngày${activeUntil ? ` đến ${activeUntil}` : ""}.`
            : "Nhập mã trong chai sữa Ủ để mở gói 30 lượt scan AI mỗi ngày."}
        </Text>
      </View>
    </LinearGradient>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [milkSelectedId, setMilkSelectedId] = useState<string | null>(null);

  const statsQ = useQuery({
    queryKey: ["users", "profile", "stats"],
    queryFn: getProfileStatsApi,
  });
  const workoutStreakQ = useQuery({
    queryKey: ["workout-sessions", "streak"],
    queryFn: getWorkoutStreakApi,
  });
  const entitlementQ = useQuery({
    queryKey: ["v2", "scan-entitlements"],
    queryFn: getScanEntitlementsApi,
  });
  const ratingStatusQ = useQuery({
    queryKey: ["v2", "rating-prompt-status"],
    queryFn: getRatingPromptStatusApi,
  });

  const user = auth.user;
  const profile = user?.profile;
  const bmi =
    profile?.heightCm && profile?.weightKg
      ? profile.weightKg / (profile.heightCm / 100) ** 2
      : undefined;
  const milkQ = useQuery({
    queryKey: ["v2", "nut-milk", bmi],
    queryFn: () => getNutMilkRecommendationsApi({ bmi }),
  });
  const milkMutation = useMutation({
    mutationFn: (selectedFlavorId: string) =>
      selectNutMilkFlavorApi({
        selectedFlavorId,
        recommendedFlavorId: milkQ.data?.flavors[0]?.flavorId,
        bmi,
        source: "manual_profile",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["v2", "nut-milk"] });
    },
  });
  const savedMilkId = milkQ.data?.currentPreference?.selectedFlavorId;
  const activeMilkId = milkSelectedId ?? savedMilkId;
  const streakDays = workoutStreakQ.data?.currentStreak ?? statsQ.data?.streakDays ?? 0;
  const totalWork = statsQ.data?.totalWorkouts ?? 0;
  const totalKcal = statsQ.data?.totalKcalBurned ?? 0;

  useEffect(() => {
    if (
      entitlementQ.data?.hasActiveEntitlement === true &&
      ratingStatusQ.data?.status === "eligible"
    ) {
      setRatingVisible(true);
    }
  }, [entitlementQ.data?.hasActiveEntitlement, ratingStatusQ.data?.status]);

  const fmtKcal =
    totalKcal >= 1000 ? `${(totalKcal / 1000).toFixed(1)}k` : String(totalKcal);

  // Highest achieved milestone = "active"; past achieved = "done"; future = "locked"
  const getMilestoneState = (m: number): "active" | "done" | "locked" => {
    if (streakDays < m) return "locked";
    const nextIdx = MILESTONES.findIndex((ms) => ms.days > streakDays);
    const topIdx = nextIdx === -1 ? MILESTONES.length - 1 : nextIdx - 1;
    return MILESTONES[topIdx]?.days === m ? "active" : "done";
  };

  const achievementTitle =
    streakDays >= 60
      ? "Người bất khuất"
      : streakDays >= 28
        ? "Người kiên trì"
        : streakDays >= 14
          ? "Người chăm chỉ"
          : streakDays >= 7
            ? "Người mới bắt đầu"
            : "Đang xây dựng thói quen";

  const confirmLogout = (): void => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          setLogoutLoading(true);
          await auth.logout();
          setLogoutLoading(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient header — rounded bottom corners ── */}
      <LinearGradient
        colors={[PRIMARY, PRIMARY_DARK]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.avatarCircle}>
          <Ionicons name="person-outline" size={36} color="#FFF" />
        </View>
        <Text style={styles.headerName}>{user?.name ?? ""}</Text>
        <Text style={styles.headerEmail}>{user?.email ?? ""}</Text>

        <View style={styles.statsRow}>
          {[
            { num: String(streakDays), lbl: "Ngày streak" },
            { num: String(totalWork), lbl: "Bài tập" },
            { num: fmtKcal, lbl: "Calo đốt" },
          ].map(({ num, lbl }) => (
            <View key={lbl} style={styles.statBox}>
              <Text style={styles.statNum}>{num}</Text>
              <Text style={styles.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <ScanAccountBanner
          status={entitlementQ.data}
          loading={entitlementQ.isLoading}
        />

        {/* ── Thông tin cá nhân ── */}
        <SectionTitle title="Thông tin cá nhân" />
        <Card>
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={user?.email ?? "—"}
          />
          <InfoRow
            icon="calendar-outline"
            label="Tuổi"
            value={profile?.age ? `${profile.age} tuổi` : "—"}
          />
          <InfoRow
            icon="resize-outline"
            label="Chiều cao"
            value={profile?.heightCm ? `${profile.heightCm} cm` : "—"}
            action="Cập nhật"
            onAction={() => router.push("/(tabs)/profile/edit" as never)}
          />
          <InfoRow
            icon="barbell-outline"
            label="Cân nặng"
            value={profile?.weightKg ? `${profile.weightKg} kg` : "—"}
            action="Cập nhật"
            onAction={() => router.push("/(tabs)/profile/edit" as never)}
          />
          <InfoRow
            icon="flag-outline"
            label="Mục tiêu"
            value={GOAL_LABEL[profile?.goalType ?? ""] ?? "—"}
            action="Thay đổi"
            onAction={() => router.push("/(tabs)/profile/edit" as never)}
          />
          <InfoRow
            icon="body-outline"
            label="Chỉ số BMI"
            value="Xem chi tiết"
            action="→"
            onAction={() => router.push("/(tabs)/bmi" as never)}
            last
          />
        </Card>

        <SectionTitle title="Gói scan AI" />
        <View style={styles.redeemStack}>
          <ScanEntitlementBadge status={entitlementQ.data} />
          <RedeemCodeCard onRedeemed={() => setRatingVisible(true)} />
        </View>

        <SectionTitle title="Sữa Ủ phù hợp" />
        <Card>
          <Text style={styles.milkDisclaimer}>
            {milkQ.data?.disclaimer ??
              "Gợi ý sản phẩm theo sở thích và thể trạng, không phải tư vấn y khoa."}
          </Text>
          {(milkQ.data?.flavors ?? []).map((flavor) => {
            const selected = activeMilkId === flavor.flavorId;
            return (
              <Pressable
                key={flavor.flavorId}
                style={[styles.milkOption, selected && styles.milkOptionActive]}
                onPress={() => setMilkSelectedId(flavor.flavorId)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.milkName}>{flavor.nameVi}</Text>
                  <Text style={styles.milkCopy}>{flavor.positioningVi}</Text>
                </View>
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={selected ? PRIMARY_DARK : INACTIVE}
                />
              </Pressable>
            );
          })}
          <Pressable
            style={[
              styles.milkSave,
              (!activeMilkId || milkMutation.isPending) &&
                styles.milkSaveDisabled,
            ]}
            disabled={!activeMilkId || milkMutation.isPending}
            onPress={() => {
              if (activeMilkId) milkMutation.mutate(activeMilkId);
            }}
          >
            <Text style={styles.milkSaveText}>
              {milkMutation.isPending
                ? "Đang lưu..."
                : savedMilkId
                  ? "Cập nhật lựa chọn"
                  : "Lưu lựa chọn"}
            </Text>
          </Pressable>
        </Card>

        {/* ── Thành tích — gradient card với border cam ── */}
        <SectionTitle title="Thành tích" />
        <LinearGradient
          colors={["#FFF9F2", "#FFEFD8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.achieveCard}
        >
          {/* Hero row */}
          <View style={styles.achieveHero}>
            <View style={styles.achieveIcon}>
              <Ionicons name="ribbon-outline" size={28} color={STREAK_BADGE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.achieveTitle}>{achievementTitle}</Text>
              <Text style={styles.achieveSub}>
                Duy trì {streakDays} ngày liên tiếp
              </Text>
            </View>
          </View>

          {/* Milestone badges */}
          <View style={styles.badgeRow}>
            {MILESTONES.map(({ days, icon }) => (
              <MilestoneBadge
                key={days}
                days={days}
                icon={icon}
                state={getMilestoneState(days)}
              />
            ))}
          </View>
        </LinearGradient>

        {/* ── Cài đặt ── */}
        <SectionTitle title="Cài đặt" />
        <Card>
          <SettingsRow
            icon="notifications-outline"
            label="Thông báo"
            onPress={() =>
              router.push("/(tabs)/profile/notifications" as never)
            }
          />
          <SettingsRow
            icon="shield-outline"
            label="Quyền riêng tư"
            onPress={() => router.push("/(tabs)/profile/help" as never)}
          />
          <SettingsRow
            icon="help-circle-outline"
            label="Trợ giúp & Hỗ trợ"
            onPress={() => router.push("/(tabs)/profile/help" as never)}
          />
          <SettingsRow
            icon="log-out-outline"
            label={logoutLoading ? "Đang đăng xuất..." : "Đăng xuất"}
            onPress={confirmLogout}
            danger
            last
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTxt}>Ủ App · Phiên bản 1.0.0</Text>
          <Text style={styles.footerTxt}>© 2026 Ú Health & Wellness</Text>
        </View>
      </ScrollView>
      <AppRatingPrompt
        visible={ratingVisible}
        contextNote="Đánh giá sau khi kích hoạt mã scan AI thành công."
        onClose={() => {
          setRatingVisible(false);
          void queryClient.invalidateQueries({ queryKey: ["v2", "rating-prompt-status"] });
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header — rounded bottom corners
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  headerName: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  headerEmail: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 20, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  scroll: { paddingHorizontal: 16 },
  scanBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  scanBannerActive: {
    borderColor: "#D5EAA0",
  },
  scanBannerInactive: {
    borderColor: "#FFD59E",
  },
  scanBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },
  scanBannerCopy: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    lineHeight: 18,
    marginTop: 3,
  },
  redeemStack: { gap: 12 },

  // Achievement card — gradient + border
  achieveCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FFCC80",
    padding: 16,
    shadowColor: STREAK_BADGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  achieveHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  achieveIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF3EE",
    alignItems: "center",
    justifyContent: "center",
  },
  achieveTitle: { fontSize: 15, fontWeight: "700", color: TEXT },
  achieveSub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  badgeRow: { flexDirection: "row", justifyContent: "space-between" },

  footer: { alignItems: "center", marginTop: 32, gap: 4 },
  footerTxt: { fontSize: 12, color: "#BDBDBD" },
  milkDisclaimer: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    lineHeight: 18,
    paddingVertical: 12,
  },
  milkOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F0F0",
  },
  milkOptionActive: { backgroundColor: "#F7FBEE" },
  milkName: { fontSize: 14, fontWeight: "700", color: TEXT },
  milkCopy: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
    lineHeight: 18,
  },
  milkSave: {
    alignItems: "center",
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_DARK,
  },
  milkSaveDisabled: { opacity: 0.5 },
  milkSaveText: { color: "#FFFFFF", fontWeight: "700" },
});
