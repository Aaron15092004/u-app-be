// Screen 3 of 3 — "Bắt đầu hành trình khỏe mạnh"
// D-34: setOnboardingSeen(true) called BEFORE navigation
// D-36: two CTAs — filled (register) + outlined (login)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../../components/ui/PrimaryButton";
import OnboardingDots from "../../components/ui/OnboardingDots";
import { setOnboardingSeen } from "../../lib/storage/mmkv";
import {
  BACKGROUND,
  PRIMARY,
  PRIMARY_DARK,
  TEXT,
  TEXT_SECONDARY,
} from "../../constants/colors";

export default function OnboardingScreen3(): React.JSX.Element {
  const router = useRouter();

  const handleRegister = (): void => {
    setOnboardingSeen(true);
    router.replace("/(auth)/register");
  };

  const handleLogin = (): void => {
    setOnboardingSeen(true);
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero: green circle + 2 floating badges (matches Figma) */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroCircle}>
            <Ionicons name="heart" size={88} color="#FFFFFF" />
          </View>
          {/* Top-right badge: smiley */}
          <View style={[styles.badge, styles.badgeTopRight]}>
            <Ionicons name="happy-outline" size={24} color="#FFFFFF" />
          </View>
          {/* Bottom-left badge: lightning */}
          <View style={[styles.badge, styles.badgeBottomLeft]}>
            <Ionicons name="flash" size={24} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Bắt đầu hành trình khỏe mạnh</Text>
        <Text style={styles.subtitle}>
          Xây dựng thói quen lành mạnh và đạt được mục tiêu sức khỏe của bạn
        </Text>
      </View>

      <View style={styles.bottom}>
        <OnboardingDots total={3} current={2} />
        <View style={{ height: 28 }} />
        <PrimaryButton
          variant="filled"
          label="Tạo tài khoản"
          onPress={handleRegister}
        />
        <View style={{ height: 12 }} />
        <PrimaryButton
          variant="outlined"
          label="Đăng nhập"
          onPress={handleLogin}
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
  heroWrapper: {
    width: 210,
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  heroCircle: {
    width: 144,
    height: 144,
    borderRadius: 85,
    backgroundColor: PRIMARY_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  badge: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 85,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeTopRight: {
    top: 24,
    right: 24,
    backgroundColor: "#FFC107",
  },
  badgeBottomLeft: {
    bottom: 16,
    left: 32,
    backgroundColor: "#FF6B35",
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
