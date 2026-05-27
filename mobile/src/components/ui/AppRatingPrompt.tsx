import React, { useState } from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as StoreReview from "expo-store-review";
import { dismissRatingPromptApi, submitAppRatingApi } from "../../lib/api/v2-contracts.api";
import type { IV2RatingTrigger } from "../../lib/api/types";
import { PRIMARY_DARK, SURFACE, TEXT, TEXT_SECONDARY } from "../../constants/colors";
import { APP_STORE_URL, PLAY_STORE_URL } from "../../constants/config";
import PrimaryButton from "./PrimaryButton";

interface AppRatingPromptProps {
  visible: boolean;
  trigger?: IV2RatingTrigger;
  contextNote?: string;
  onClose: () => void;
}

export default function AppRatingPrompt({
  visible,
  trigger = "manual",
  contextNote,
  onClose,
}: AppRatingPromptProps): React.JSX.Element {
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => submitAppRatingApi({
      stars,
      comment: [contextNote, comment.trim()].filter(Boolean).join("\n\n") || undefined,
      trigger,
      platform: Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "unknown",
      storeReviewRequested: stars >= 4,
      deviceInfo: { source: "post_redeem_prompt" },
    }),
    onSuccess: async () => {
      if (stars >= 4) {
        await requestStoreReviewOrFallback();
      }
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error ?? e.message ?? "Không thể gửi đánh giá.");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => dismissRatingPromptApi(trigger),
    onSettled: onClose,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Bạn thấy trải nghiệm kích hoạt thế nào?</Text>
          <Text style={styles.sub}>Chọn số sao và góp ý ngắn để đội ngũ cải thiện app.</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setStars(value as 1 | 2 | 3 | 4 | 5)} hitSlop={8}>
                <Ionicons
                  name={value <= stars ? "star" : "star-outline"}
                  size={32}
                  color="#FFB300"
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Góp ý thêm (không bắt buộc)"
            multiline
            maxLength={1000}
            style={styles.input}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton
            label="Gửi đánh giá"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
          />
          <Pressable style={styles.skip} onPress={() => dismissMutation.mutate()} disabled={dismissMutation.isPending}>
            <Text style={styles.skipText}>Để sau</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: TEXT },
  sub: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 19 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 10, paddingVertical: 4 },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    color: TEXT,
    textAlignVertical: "top",
  },
  error: { fontSize: 12, color: "#D32F2F" },
  skip: { alignItems: "center", paddingVertical: 8 },
  skipText: { color: PRIMARY_DARK, fontWeight: "700" },
});

async function requestStoreReviewOrFallback(): Promise<void> {
  try {
    if (await StoreReview.hasAction()) {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
        return;
      }
    }
  } catch {
    // Fall through to public store URL fallback.
  }

  const expoStoreUrl = StoreReview.storeUrl();
  const configuredStoreUrl = Platform.select({
    ios: APP_STORE_URL,
    android: PLAY_STORE_URL,
    default: "",
  });
  const url = expoStoreUrl || configuredStoreUrl;
  if (url) {
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url).catch(() => undefined);
    }
  }
}
