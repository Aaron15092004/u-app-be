import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TEXT, TEXT_SECONDARY } from '../../constants/colors';

interface MacroProgressBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export default function MacroProgressBar({
  label,
  current,
  goal,
  color,
  unit,
}: MacroProgressBarProps): React.JSX.Element {
  const fillPercent = Math.min(1, goal > 0 ? current / goal : 0) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current}/{goal}{unit ?? 'g'}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: color, width: `${fillPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT,
  },
  value: {
    fontSize: 12,
    fontWeight: '400',
    color: TEXT_SECONDARY,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});
