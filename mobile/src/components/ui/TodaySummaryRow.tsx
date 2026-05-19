import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import WeeklyStatCard from './WeeklyStatCard';

interface TodaySummaryRowProps {
  kcal: number;
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  onWaterPress: () => void;
}

export default function TodaySummaryRow({
  kcal,
  waterGlasses,
  waterGoal,
  workoutMinutes,
  onWaterPress,
}: TodaySummaryRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <WeeklyStatCard label="Đã ăn" value={kcal} unit="kcal" />

      <TouchableOpacity
        style={styles.waterCard}
        onPress={onWaterPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Xem nhật ký nước"
      >
        <WeeklyStatCard
          label="Nước"
          value={`${waterGlasses} / ${waterGoal}`}
          unit="ly"
        />
      </TouchableOpacity>

      <WeeklyStatCard label="Tập luyện" value={workoutMinutes} unit="phút" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  waterCard: {
    flex: 1,
  },
});
