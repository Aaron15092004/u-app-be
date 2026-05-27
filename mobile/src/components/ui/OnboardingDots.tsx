import React from "react";
import { StyleSheet, View } from "react-native";
import { PRIMARY, INACTIVE } from "../../constants/colors";

interface OnboardingDotsProps {
  total: number;
  current: number; // 0-indexed
}

export default function OnboardingDots({
  total,
  current,
}: OnboardingDotsProps): React.JSX.Element {
  // Clamp current to [0, total-1] to avoid crashes
  const safeCurrent = Math.max(0, Math.min(current, total - 1));

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === safeCurrent;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: PRIMARY,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: INACTIVE,
  },
});
