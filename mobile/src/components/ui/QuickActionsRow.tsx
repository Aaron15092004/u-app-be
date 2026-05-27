import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TEXT } from "../../constants/colors";

interface QuickActionsRowProps {
  onScan: () => void;
  onWorkout: () => void;
  onHabits: () => void;
}

interface ActionButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  bgColor: string;
  iconColor: string;
}

function ActionButton({
  iconName,
  label,
  onPress,
  bgColor,
  iconColor,
}: ActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={iconName} size={28} color={iconColor} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export default function QuickActionsRow({
  onScan,
  onWorkout,
  onHabits,
}: QuickActionsRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <ActionButton
        iconName="scan-outline"
        label="Quét bữa ăn"
        onPress={onScan}
        bgColor="#E8F5E9"
        iconColor="#4CAF50"
      />
      <ActionButton
        iconName="barbell-outline"
        label="Bắt đầu tập"
        onPress={onWorkout}
        bgColor="#FFF3E0"
        iconColor="#FF6B35"
      />
      <ActionButton
        iconName="checkmark-circle-outline"
        label="Thói quen"
        onPress={onHabits}
        bgColor="#E3F2FD"
        iconColor="#2196F3"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
    marginTop: 8,
    textAlign: "center",
  },
});
