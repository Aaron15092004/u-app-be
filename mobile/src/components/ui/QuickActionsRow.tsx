import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRIMARY } from '../../constants/colors';

interface QuickActionsRowProps {
  onScan: () => void;
  onWorkout: () => void;
  onHabits: () => void;
}

interface ActionButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function ActionButton({ iconName, label, onPress }: ActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={iconName} size={28} color="#FFFFFF" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export default function QuickActionsRow({
  onScan,
  onWorkout,
  onHabits,
}: QuickActionsRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <ActionButton
        iconName="scan-outline"
        label="Quét bữa ăn"
        onPress={onScan}
      />
      <ActionButton
        iconName="barbell-outline"
        label="Bắt đầu tập"
        onPress={onWorkout}
      />
      <ActionButton
        iconName="checkmark-circle-outline"
        label="Thói quen"
        onPress={onHabits}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
});
