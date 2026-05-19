import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRIMARY, TEXT } from '../../constants/colors';

interface WaterControlsProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isLoading: boolean;
}

export default function WaterControls({
  count,
  onIncrement,
  onDecrement,
  isLoading,
}: WaterControlsProps): React.JSX.Element {
  const canDecrement = count > 0 && !isLoading;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={canDecrement ? onDecrement : undefined}
        style={[styles.minusButton, !canDecrement && styles.disabledButton]}
        accessibilityRole="button"
        accessibilityLabel="Giảm ly nước"
        disabled={!canDecrement}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={PRIMARY} />
        ) : (
          <Ionicons
            name="remove"
            size={24}
            color={canDecrement ? PRIMARY : PRIMARY}
            style={!canDecrement && styles.disabledIcon}
          />
        )}
      </Pressable>

      <Text style={styles.count}>{count}</Text>

      <Pressable
        onPress={isLoading ? undefined : onIncrement}
        style={[styles.plusButton, isLoading && styles.disabledButton]}
        accessibilityRole="button"
        accessibilityLabel="Thêm ly nước"
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="add" size={24} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  minusButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  disabledIcon: {
    opacity: 1,
  },
  count: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    minWidth: 48,
    textAlign: 'center',
  },
});
