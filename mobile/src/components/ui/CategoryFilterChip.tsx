import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { PRIMARY, TEXT } from '../../constants/colors';

interface CategoryFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function CategoryFilterChip({
  label,
  active,
  onPress,
}: CategoryFilterChipProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: PRIMARY,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: TEXT,
  },
});
