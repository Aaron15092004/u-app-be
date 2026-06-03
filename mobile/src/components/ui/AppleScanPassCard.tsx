import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { finishTransaction, useIAP, type Purchase } from "expo-iap";
import { verifyAppleScanPassApi } from "../../lib/api/v2-contracts.api";
import { PRIMARY_DARK, SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";
import PrimaryButton from "./PrimaryButton";

const IOS_SCAN_PASS_PRODUCT_ID = "com.uapp.health.ai_scan_pass_30d";

interface AppleScanPassCardProps {
  onPurchased?: () => void;
}

export default function AppleScanPassCard({
  onPurchased,
}: AppleScanPassCardProps): React.JSX.Element | null {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      if (purchase.productId !== IOS_SCAN_PASS_PRODUCT_ID) return;
      setBusy(true);
      setMessage(null);
      try {
        await verifyAppleScanPassApi({
          productId: purchase.productId,
          transactionId: purchase.id,
          purchaseToken: purchase.purchaseToken ?? null,
          transactionDate: purchase.transactionDate ?? null,
          environment: "environmentIOS" in purchase ? purchase.environmentIOS ?? null : null,
        });
        await finishTransaction({ purchase, isConsumable: true });
        await queryClient.invalidateQueries({ queryKey: ["v2", "scan-entitlements"] });
        setMessage("Đã kích hoạt gói scan AI qua Apple.");
        onPurchased?.();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Không thể kích hoạt giao dịch Apple.");
      } finally {
        setBusy(false);
      }
    },
    [onPurchased, queryClient],
  );

  const iap = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: (error) => {
      setBusy(false);
      const code = String(error.code ?? "");
      const message = String(error.message ?? "");
      const cancelled = code.toLowerCase().includes("cancel") || message.toLowerCase().includes("cancel");
      if (!cancelled) {
        setMessage(error.message || "Thanh toán Apple thất bại. Vui lòng thử lại.");
      }
    },
    onError: (error) => setMessage(error.message),
  });

  useEffect(() => {
    if (Platform.OS !== "ios" || !iap.connected) return;
    void iap.fetchProducts({ skus: [IOS_SCAN_PASS_PRODUCT_ID], type: "in-app" });
  }, [iap.connected]);

  if (Platform.OS !== "ios") return null;

  const product = iap.products.find((item) => item.id === IOS_SCAN_PASS_PRODUCT_ID);
  const price = product?.displayPrice ?? "qua Apple";

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.iconBox}>
          <Ionicons name="logo-apple" size={18} color={PRIMARY_DARK} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mua gói scan AI bằng Apple</Text>
          <Text style={styles.sub}>
            Gói 30 ngày, 30 lượt quét AI mỗi ngày. Đây là lựa chọn mua trực tiếp trong app cho người dùng iOS.
          </Text>
        </View>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <PrimaryButton
        label={busy ? "Đang xử lý..." : `Mua gói scan ${price}`}
        loading={busy}
        disabled={busy || !iap.connected}
        onPress={async () => {
          setBusy(true);
          setMessage(null);
          try {
            await iap.requestPurchase({
              request: { apple: { sku: IOS_SCAN_PASS_PRODUCT_ID } },
              type: "in-app",
            });
          } catch (err) {
            setBusy(false);
            setMessage(err instanceof Error ? err.message : "Không thể mở thanh toán Apple.");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F3F3",
  },
  title: { fontSize: 16, fontWeight: "700", color: TEXT },
  sub: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18, marginTop: 2 },
  message: { fontSize: 12, lineHeight: 18, color: TEXT_SECONDARY },
});
