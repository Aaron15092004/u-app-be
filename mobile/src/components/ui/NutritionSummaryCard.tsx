import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NutritionSummaryCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function NutritionSummaryCard({
  calories,
  protein,
  carbs,
  fat,
}: NutritionSummaryCardProps): React.JSX.Element {
  return (
    <View>
      {/* Green kcal card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Tổng calo</Text>
        <Text style={styles.cardValue}>{Math.round(calories)}</Text>
        <Text style={styles.cardUnit}>kcal</Text>
      </View>

      {/* 3-column macro row */}
      <View style={styles.macroRow}>
        {/* Protein */}
        <View style={styles.macroColumn}>
          <Ionicons name="fitness-outline" size={20} color="#4CAF50" />
          <Text style={styles.macroValue}>{protein.toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroColumn}>
          <Ionicons name="leaf-outline" size={20} color="#FFA726" />
          <Text style={styles.macroValue}>{carbs.toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>

        {/* Fat */}
        <View style={styles.macroColumn}>
          <Ionicons name="water-outline" size={20} color="#64B5F6" />
          <Text style={styles.macroValue}>{fat.toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Chất béo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  cardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  cardUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  macroColumn: {
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
});
