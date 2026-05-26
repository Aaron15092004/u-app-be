import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { redeemCampaignCodeApi } from "../../lib/api/v2-contracts.api";
import type { IV2RedeemCampaignCodeResponse } from "../../lib/api/types";
import { PRIMARY_DARK, SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";
import PrimaryButton from "./PrimaryButton";

interface RedeemCodeCardProps {
  title?: string;
  compact?: boolean;
  onRedeemed?: (result: IV2RedeemCampaignCodeResponse) => void;
}

export default function RedeemCodeCard({
  title = "Kích hoạt mã scan AI",
  compact = false,
  onRedeemed,
}: RedeemCodeCardProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => redeemCampaignCodeApi({ code, source: "manual" }),
    onSuccess: async (result) => {
      setIsSuccess(true);
      setMessage(result.message || "Kích hoạt thành công.");
      setCode("");
      await queryClient.invalidateQueries({ queryKey: ["v2", "scan-entitlements"] });
      onRedeemed?.(result);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setIsSuccess(false);
      setMessage(e.response?.data?.error ?? e.message ?? "Không thể kích hoạt mã. Vui lòng thử lại.");
    },
  });

  function submit() {
    const trimmed = code.trim();
    if (!trimmed) {
      setIsSuccess(false);
      setMessage("Vui lòng nhập mã trên chai sữa.");
      return;
    }
    setMessage(null);
    mutation.mutate();
  }

  return (
    <View style={[styles.card, compact && styles.compact]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Nhập mã in trên chai để nhận 30 lượt quét AI mỗi ngày.</Text>
      <View style={styles.row}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="VD: U-ABCD-1234"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          editable={!mutation.isPending}
        />
      </View>
      {message && (
        <Text style={[styles.message, isSuccess ? styles.success : styles.error]}>{message}</Text>
      )}
      <PrimaryButton
        label={mutation.isPending ? "Đang kích hoạt..." : "Kích hoạt"}
        onPress={submit}
        loading={mutation.isPending}
        disabled={!code.trim()}
      />
      {mutation.isPending && <ActivityIndicator color={PRIMARY_DARK} style={styles.inlineLoading} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  compact: {
    padding: 14,
  },
  title: { fontSize: 16, fontWeight: "700", color: TEXT },
  sub: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },
  row: { gap: 8 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    fontSize: 15,
    color: TEXT,
    backgroundColor: "#FFFFFF",
  },
  message: { fontSize: 12, lineHeight: 18 },
  success: { color: "#2E7D32" },
  error: { color: "#D32F2F" },
  inlineLoading: { marginTop: -4 },
});
