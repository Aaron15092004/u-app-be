import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  PRIMARY,
  TEXT,
  TEXT_SECONDARY,
  BADGE_LOCKED,
} from "../../constants/colors";

function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours ?? 8, minutes ?? 0, 0, 0);
  return d;
}

function formatTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

interface NotifTimeRowProps {
  label: string;
  sublabel: string;
  time: string;
  onTimeChange: (newTime: string) => void;
}

export default function NotifTimeRow({
  label,
  sublabel,
  time,
  onTimeChange,
}: NotifTimeRowProps): React.JSX.Element {
  const [showPicker, setShowPicker] = useState(false);

  const handlePress = (): void => {
    setShowPicker(true);
  };

  const handleChange = (_: unknown, selectedDate?: Date): void => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) {
      onTimeChange(formatTimeString(selectedDate));
    }
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.left}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.sublabel}>{sublabel}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.time}>{time}</Text>
          <Ionicons name="chevron-forward" size={16} color={BADGE_LOCKED} />
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={parseTimeString(time)}
          mode="time"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pressed: {
    backgroundColor: "#F5F5F5",
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: "400",
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY,
  },
});
