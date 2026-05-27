import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SocialAuthButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  loading?: boolean;
}

const GOOGLE_CONFIG = {
  backgroundColor: "#FFFFFF",
  borderColor: "#D1D5DB",
  iconName: "logo-google" as const,
  iconColor: "#4285F4",
  label: "Tiếp tục với Google",
  textColor: "#212121",
};

const APPLE_CONFIG = {
  backgroundColor: "#000000",
  borderColor: "#000000",
  iconName: "logo-apple" as const,
  iconColor: "#FFFFFF",
  label: "Tiếp tục với Apple",
  textColor: "#FFFFFF",
};

export default function SocialAuthButton({
  provider,
  onPress,
  loading = false,
}: SocialAuthButtonProps): React.JSX.Element {
  const config = provider === "google" ? GOOGLE_CONFIG : APPLE_CONFIG;

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        pressed && !loading && styles.pressed,
        loading && styles.loading,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={config.iconColor} size="small" />
      ) : (
        <View style={styles.inner}>
          <Ionicons
            name={config.iconName}
            size={22}
            color={config.iconColor}
            style={styles.icon}
          />
          <Text style={[styles.label, { color: config.textColor }]}>
            {config.label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  loading: {
    opacity: 0.7,
  },
});
