import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { IFoodItem } from "../../lib/api/types";
import PrimaryButton from "./PrimaryButton";

interface ServingSizeSheeetProps {
  visible: boolean;
  item: IFoodItem | null;
  onClose: () => void;
  onAdd: (grams: number) => void;
}

export default function ServingSizeSheet({
  visible,
  item,
  onClose,
  onAdd,
}: ServingSizeSheeetProps): React.JSX.Element {
  const [servingSize, setServingSize] = useState("100");

  const grams = parseInt(servingSize, 10) || 0;
  const estimatedKcal = item ? Math.round((item.kcalPer100g * grams) / 100) : 0;

  const handleAdd = (): void => {
    if (grams > 0) {
      onAdd(grams);
      setServingSize("100");
    }
  };

  const handleClose = (): void => {
    setServingSize("100");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Đóng"
      >
        <Pressable
          style={styles.sheet}
          onPress={() => {
            /* prevent dismiss on sheet tap */
          }}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Food name */}
          <Text style={styles.foodName} numberOfLines={2}>
            {item?.name ?? ""}
          </Text>

          {/* Kcal per 100g */}
          <Text style={styles.kcalSub}>
            {item?.kcalPer100g ?? 0} kcal / 100g
          </Text>

          {/* Serving size label */}
          <Text style={styles.inputLabel}>Khối lượng (g)</Text>

          {/* Serving size input */}
          <TextInput
            style={styles.input}
            value={servingSize}
            onChangeText={setServingSize}
            keyboardType="numeric"
            returnKeyType="done"
            selectTextOnFocus
            accessibilityLabel="Khối lượng (gram)"
          />

          {/* Live calc row */}
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Dinh dưỡng ước tính:</Text>
            <Text style={styles.calcValue}>{estimatedKcal} kcal</Text>
          </View>

          {/* Add button */}
          <View style={styles.buttonWrapper}>
            <PrimaryButton
              variant="filled"
              label="Thêm vào nhật ký"
              onPress={handleAdd}
              disabled={grams <= 0}
            />
          </View>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  foodName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
  },
  kcalSub: {
    fontSize: 14,
    fontWeight: "400",
    color: "#757575",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#212121",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#212121",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  calcLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#757575",
  },
  calcValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
  },
  buttonWrapper: {
    marginTop: 16,
  },
});
