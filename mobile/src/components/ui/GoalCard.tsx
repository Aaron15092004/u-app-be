import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  PRIMARY,
  BORDER_DEFAULT,
  TEXT_SECONDARY,
} from "../../constants/colors";

const PRIMARY_BG = "rgba(76,175,80,0.1)";

interface GoalCardProps {
  label: string;
  iconName: string; // Ionicons glyph
  value: "lose" | "maintain" | "gain";
  selected: boolean;
  onPress: () => void;
}

export default function GoalCard({
  label,
  iconName,
  selected,
  onPress,
}: GoalCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}
      >
        <Ionicons
          name={iconName as React.ComponentProps<typeof Ionicons>["name"]}
          size={28}
          color={selected ? PRIMARY : TEXT_SECONDARY}
        />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  cardUnselected: {
    borderColor: BORDER_DEFAULT,
    backgroundColor: "#FFFFFF",
  },
  cardSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY_BG,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    marginBottom: 10,
  },
  iconWrapperSelected: {
    backgroundColor: "rgba(76,175,80,0.15)",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  labelSelected: {
    color: PRIMARY,
  },
});
