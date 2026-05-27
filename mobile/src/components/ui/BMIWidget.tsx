import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PRIMARY, PRIMARY_DARK } from "../../constants/colors";

interface BMIWidgetProps {
  bmi: { value: number; category: string } | null;
  onPress: () => void;
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "underweight": return "Thiếu cân";
    case "normal": return "Bình thường";
    case "overweight": return "Thừa cân";
    case "obese": return "Béo phì";
    default: return category;
  }
}

function getCategoryMessage(category: string): string {
  switch (category) {
    case "underweight": return "Hãy bổ sung dinh dưỡng để đạt cân nặng lý tưởng";
    case "normal": return "Bạn đang ở mức khỏe mạnh, hãy duy trì nhé!";
    case "overweight": return "Tiếp tục vận động để cải thiện sức khỏe";
    case "obese": return "Hãy tham khảo chuyên gia để có kế hoạch phù hợp";
    default: return "";
  }
}

export default function BMIWidget({
  bmi,
  onPress,
}: BMIWidgetProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Chỉ số BMI"
    >
      <LinearGradient
        colors={[PRIMARY_DARK, PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Chỉ số BMI</Text>
          <Text style={styles.subtitle}>
            {bmi ? "Cập nhật hôm nay" : "Chưa có dữ liệu"}
          </Text>
        </View>
        <Ionicons name="pulse-outline" size={22} color="rgba(255,255,255,0.8)" />
      </View>

      {bmi ? (
        <>
          <View style={styles.valueRow}>
            <Text style={styles.bmiValue}>{bmi.value.toFixed(1)}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryLabel}>
                {getCategoryLabel(bmi.category)}
              </Text>
            </View>
          </View>
          <Text style={styles.message}>{getCategoryMessage(bmi.category)}</Text>
        </>
      ) : (
        <Text style={styles.updateText}>Nhấn để cập nhật BMI →</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  message: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  updateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
});
