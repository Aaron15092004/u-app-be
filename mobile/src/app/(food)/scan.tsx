import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFoodScanStore } from '../../stores/foodScanStore';

export default function ScanScreen() {
  const { isScanning } = useFoodScanStore();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Quét bữa ăn — Phase 4 Plan 06 sẽ implement</Text>
      {isScanning && <Text style={styles.text}>Đang phân tích...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 16,
  },
});
