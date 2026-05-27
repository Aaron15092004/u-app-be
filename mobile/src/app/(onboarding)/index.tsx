// Screen 1 of 3 — "Chào mừng đến với Ủ"
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import PrimaryButton from "../../components/ui/PrimaryButton";
import OnboardingDots from "../../components/ui/OnboardingDots";
import { BACKGROUND, TEXT, TEXT_SECONDARY } from "../../constants/colors";
import LogoSvg from "../../../assets/images/logo-svg.svg";

export default function OnboardingScreen1(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LogoSvg width={144} height={144} />
        </View>

        <Text style={styles.title}>Chào mừng đến với Ủ</Text>
        <Text style={styles.subtitle}>
          Ứng dụng quản lý sức khỏe toàn diện với dinh dưỡng từ thực vật
        </Text>
      </View>

      <View style={styles.bottom}>
        <OnboardingDots total={3} current={0} />
        <View style={{ height: 28 }} />
        <PrimaryButton
          label="Tiếp tục"
          onPress={() => router.push("/(onboarding)/screen-2")}
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
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
