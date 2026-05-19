import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFoodScanStore } from '../../stores/foodScanStore';

export default function ResultScreen() {
  const { scanResult } = useFoodScanStore();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kết quả phân tích — Phase 4 Plan 06 sẽ implement</Text>
      {scanResult && (
        <Text style={styles.subText}>
          Tổng: {scanResult.totals.calories} kcal
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 16,
    color: '#212121',
    textAlign: 'center',
    padding: 16,
  },
  subText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
