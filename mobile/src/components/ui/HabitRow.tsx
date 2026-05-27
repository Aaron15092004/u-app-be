import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRIMARY } from "../../constants/colors";
import type { IHabitId } from "../../lib/api/types";

interface HabitRowProps {
  habit: { id: IHabitId; name: string; iconName: string };
  isCompletedToday: boolean;
  onCheckIn: () => void;
  disabled?: boolean;
}

export default function HabitRow({
  habit,
  isCompletedToday,
  onCheckIn,
  disabled = false,
}: HabitRowProps): React.JSX.Element {
  const isDisabled = disabled || isCompletedToday;

  return (
    <View style={styles.row}>
      {/* Left: icon */}
      <View style={styles.iconWrapper}>
        <Ionicons
          name={habit.iconName as React.ComponentProps<typeof Ionicons>["name"]}
          size={20}
          color={PRIMARY}
        />
      </View>

      {/* Center: habit name */}
      <Text style={styles.habitName} numberOfLines={1}>
        {habit.name}
      </Text>

      {/* Right: CTA or checkmark */}
      {isCompletedToday ? (
        <Ionicons name="checkmark-circle" size={28} color={PRIMARY} />
      ) : (
        <Pressable
          onPress={isDisabled ? undefined : onCheckIn}
          accessibilityRole="button"
          accessibilityState={{ disabled: isCompletedToday }}
          style={({ pressed }) => [
            styles.checkInBtn,
            isDisabled && styles.checkInBtnDisabled,
            pressed && !isDisabled && styles.checkInBtnPressed,
          ]}
        >
          <Text
            style={[
              styles.checkInLabel,
              isDisabled && styles.checkInLabelDisabled,
            ]}
          >
            Đánh dấu +1
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 72,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(76,175,80,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#212121",
    marginRight: 8,
  },
  checkInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(76,175,80,0.1)",
  },
  checkInBtnDisabled: {
    opacity: 0.5,
  },
  checkInBtnPressed: {
    opacity: 0.75,
  },
  checkInLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY,
  },
  checkInLabelDisabled: {
    color: PRIMARY,
  },
});
