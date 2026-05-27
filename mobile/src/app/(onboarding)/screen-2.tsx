// Screen 2 of 3 — "Theo dõi sức khỏe hàng ngày"
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../../components/ui/PrimaryButton";
import OnboardingDots from "../../components/ui/OnboardingDots";
import {
  BACKGROUND,
  PRIMARY,
  PRIMARY_DARK,
  TEXT,
  TEXT_SECONDARY,
} from "../../constants/colors";

const FEATURE_TILE_BG = "#EEF6CA";

const FEATURES: Array<{ icon: React.ComponentProps<typeof Ionicons>["name"] }> =
  [
    { icon: "nutrition-outline" },
    { icon: "trending-up-outline" },
    { icon: "calendar-outline" },
  ];

export default function OnboardingScreen2(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.featuresRow}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureTile}>
              <Ionicons name={f.icon} size={32} color={PRIMARY_DARK} />
            </View>
          ))}
        </View>

        <Text style={styles.title}>Theo dõi sức khỏe hàng ngày</Text>
        <Text style={styles.subtitle}>
          Phân tích bữa ăn, theo dõi BMI, và quản lý lịch tập luyện một cách dễ
          dàng
        </Text>
      </View>

      <View style={styles.bottom}>
        <OnboardingDots total={3} current={1} />
        <View style={{ height: 28 }} />
        <PrimaryButton
          label="Tiếp tục"
          onPress={() => router.push("/(onboarding)/screen-3")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40,
  },
  content: {
    alignItems: "center",
  },
  featuresRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 36,
  },
  featureTile: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: FEATURE_TILE_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: TEXT,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  bottom: {
    marginTop: 40,
  },
});
