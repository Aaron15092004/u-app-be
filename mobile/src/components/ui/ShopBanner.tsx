import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import LogoSvg from "../../../assets/images/logo-svg.svg";

interface ShopBannerProps {
  url: string | null;
  isLoading: boolean;
}

export default function ShopBanner({
  url,
  isLoading,
}: ShopBannerProps): React.JSX.Element | null {
  if (url === null && !isLoading) return null;

  const handlePress = (): void => {
    if (url) void Linking.openURL(url);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.title}>Ủ Shop</Text>
          <Text style={styles.subtitle}>
            Khám phá combo sữa hạt & nước detox
          </Text>
          <Pressable
            onPress={handlePress}
            disabled={!url}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Mua ngay tại Ủ Shop"
          >
            <Text style={styles.buttonText}>Mua ngay →</Text>
          </Pressable>
        </View>
        <View style={styles.logoWrapper}>
          <LogoSvg width={88} height={115} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#F5F0E6",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#757575",
    lineHeight: 18,
    marginBottom: 14,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#6C9A24",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
