import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PRIMARY, PRIMARY_DARK } from "../../constants/colors";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "filled" | "outlined";
}

export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "filled",
}: PrimaryButtonProps): React.JSX.Element {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        variant === "outlined" && styles.outlined,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {variant === "filled" && (
        <LinearGradient
          colors={[PRIMARY, PRIMARY_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      )}
      {loading ? (
        <ActivityIndicator
          color={variant === "filled" ? "#FFFFFF" : PRIMARY}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "filled" ? styles.labelFilled : styles.labelOutlined,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  outlined: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: PRIMARY_DARK,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  labelFilled: {
    color: "#FFFFFF",
  },
  labelOutlined: {
    color: PRIMARY_DARK,
  },
});
