import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NutritionDetailRowProps {
  label: string;
  value: number;
  unit: string;
  color: string;
}

export default function NutritionDetailRow({
  label,
  value,
  unit,
  color,
}: NutritionDetailRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.leftContent}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>
        {value.toFixed(1)}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
  },
});
