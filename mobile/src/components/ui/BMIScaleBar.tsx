import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  PRIMARY,
  BMI_UNDERWEIGHT,
  BMI_NORMAL,
  BMI_OVERWEIGHT,
  BMI_OBESE,
} from '../../constants/colors';

interface BMIScaleBarProps {
  bmi: number;
}

export default function BMIScaleBar({ bmi }: BMIScaleBarProps): React.JSX.Element {
  const percent = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));

  return (
    <View style={styles.container}>
      {/* Scale bar — 4 segments */}
      <View style={styles.bar}>
        <View style={[styles.segment, { backgroundColor: BMI_UNDERWEIGHT }]} />
        <View style={[styles.segment, { backgroundColor: BMI_NORMAL }]} />
        <View style={[styles.segment, { backgroundColor: BMI_OVERWEIGHT }]} />
        <View style={[styles.segment, { backgroundColor: BMI_OBESE }]} />
      </View>

      {/* Position dot */}
      <View
        style={[
          styles.dot,
          { left: `${percent}%` as unknown as number },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: 'white',
    top: 4, // (24 - 16) / 2 = 4 to center in container
    marginLeft: -8, // offset half dot width for centering
  },
});
