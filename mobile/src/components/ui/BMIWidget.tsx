import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BMI_NORMAL,
  BMI_OBESE,
  BMI_OVERWEIGHT,
  BMI_UNDERWEIGHT,
  PRIMARY,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
} from '../../constants/colors';

interface BMIWidgetProps {
  bmi: { value: number; category: string } | null;
  onPress: () => void;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'underweight':
      return BMI_UNDERWEIGHT;
    case 'normal':
      return BMI_NORMAL;
    case 'overweight':
      return BMI_OVERWEIGHT;
    case 'obese':
      return BMI_OBESE;
    default:
      return BMI_NORMAL;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'underweight':
      return 'Thiếu cân';
    case 'normal':
      return 'Bình thường';
    case 'overweight':
      return 'Thừa cân';
    case 'obese':
      return 'Béo phì';
    default:
      return category;
  }
}

export default function BMIWidget({ bmi, onPress }: BMIWidgetProps): React.JSX.Element {
  const categoryColor = bmi ? getCategoryColor(bmi.category) : PRIMARY;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Chỉ số BMI"
    >
      <Text style={styles.title}>Chỉ số BMI</Text>
      {bmi ? (
        <View>
          <Text style={[styles.bmiValue, { color: categoryColor }]}>
            {bmi.value.toFixed(1)}
          </Text>
          <Text style={[styles.categoryLabel, { color: categoryColor }]}>
            {getCategoryLabel(bmi.category)}
          </Text>
        </View>
      ) : (
        <View>
          <Text style={styles.emptyText}>Chưa có dữ liệu BMI</Text>
          <Text style={styles.updateText}>Cập nhật ngay -{'>'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.95,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  updateText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
});
