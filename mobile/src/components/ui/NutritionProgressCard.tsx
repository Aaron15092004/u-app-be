import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PRIMARY, SURFACE, TEXT, TEXT_SECONDARY } from '../../constants/colors';
import MacroProgressBar from './MacroProgressBar';

interface NutritionProgressCardProps {
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  kcal: number;
}

export default function NutritionProgressCard({
  macros,
  kcal,
}: NutritionProgressCardProps): React.JSX.Element {
  const isEmpty =
    kcal === 0 && macros.protein === 0 && macros.carbs === 0 && macros.fat === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Dinh dưỡng hôm nay</Text>
      <View style={styles.barsContainer}>
        <MacroProgressBar
          label="Calo"
          current={kcal}
          goal={2000}
          color={PRIMARY}
          unit="kcal"
        />
        <MacroProgressBar
          label="Protein"
          current={macros.protein}
          goal={50}
          color={PRIMARY}
        />
        <MacroProgressBar
          label="Carbs"
          current={macros.carbs}
          goal={250}
          color="#FFA726"
        />
        <MacroProgressBar
          label="Chất béo"
          current={macros.fat}
          goal={70}
          color="#64B5F6"
        />
      </View>
      {isEmpty && (
        <Text style={styles.emptyText}>Chưa có bữa ăn nào hôm nay</Text>
      )}
    </View>
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  barsContainer: {
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 12,
  },
});
