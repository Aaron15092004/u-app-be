import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { IV2ScanEntitlementStatus } from "../../lib/api/types";
import { PRIMARY_DARK, SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";

interface ScanEntitlementBadgeProps {
  status?: IV2ScanEntitlementStatus;
  usedToday?: number;
  limit?: number;
  quotaMode?: "standard_daily_limit" | "entitlement_30_daily";
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function ScanEntitlementBadge({
  status,
  usedToday,
  limit,
  quotaMode,
}: ScanEntitlementBadgeProps): React.JSX.Element {
  const active = Boolean(status?.hasActiveEntitlement || quotaMode === "entitlement_30_daily");
  const dailyLimit = status?.quotaPolicy?.dailyLimit ?? limit ?? (active ? 30 : 2);
  const expiry = status?.activeUntil ? formatDate(status.activeUntil) : null;

  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <View style={styles.iconBox}>
        <Ionicons name={active ? "sparkles-outline" : "scan-outline"} size={18} color={PRIMARY_DARK} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>
          {active ? `Gói AI ${dailyLimit} lượt/ngày đang hoạt động` : `${dailyLimit} lượt quét AI/ngày`}
        </Text>
        <Text style={styles.sub}>
          {active && expiry
            ? `Hiệu lực đến ${expiry}`
            : usedToday !== undefined
              ? `Đã dùng ${usedToday}/${dailyLimit} lượt hôm nay`
              : Platform.OS === "ios"
                ? "Tài khoản iOS được kích hoạt gói scan AI mặc định."
                : "Kích hoạt mã quyền lợi sữa Ủ để tăng hạn mức."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 12,
  },
  cardActive: {
    borderColor: "#BFE6D0",
    backgroundColor: "#F3FFF8",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF7F0",
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: "700", color: TEXT },
  sub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
});
