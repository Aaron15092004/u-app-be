import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FRAME_SIZE = 260;
const ARM_LENGTH = 40;
const STROKE = 4;
const CORNER_RADIUS = 8;
const GREEN = '#4CAF50';

export default function ScanFrame(): React.JSX.Element {
  return (
    <View style={styles.frame}>
      {/* Top-left corner */}
      <View style={[styles.corner, styles.topLeft]}>
        <View style={styles.cornerHorizontal} />
        <View style={styles.cornerVertical} />
      </View>

      {/* Top-right corner */}
      <View style={[styles.corner, styles.topRight]}>
        <View style={styles.cornerHorizontal} />
        <View style={[styles.cornerVertical, styles.verticalRight]} />
      </View>

      {/* Bottom-left corner */}
      <View style={[styles.corner, styles.bottomLeft]}>
        <View style={[styles.cornerHorizontal, styles.horizontalBottom]} />
        <View style={styles.cornerVertical} />
      </View>

      {/* Bottom-right corner */}
      <View style={[styles.corner, styles.bottomRight]}>
        <View style={[styles.cornerHorizontal, styles.horizontalBottom]} />
        <View style={[styles.cornerVertical, styles.verticalRight]} />
      </View>

      {/* Center content */}
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={40} color="#FFFFFF" />
        <Text style={styles.hint}>Căn chỉnh bữa ăn vào khung</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: ARM_LENGTH,
    height: ARM_LENGTH,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  cornerHorizontal: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ARM_LENGTH,
    height: STROKE,
    backgroundColor: GREEN,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  horizontalBottom: {
    top: undefined,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerVertical: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: STROKE,
    height: ARM_LENGTH,
    backgroundColor: GREEN,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  verticalRight: {
    left: undefined,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: CORNER_RADIUS,
  },
  center: {
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
