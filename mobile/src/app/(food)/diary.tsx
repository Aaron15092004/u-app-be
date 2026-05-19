import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DiaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nhật ký bữa ăn — Phase 4 Plan 07 sẽ implement</Text>
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
});
