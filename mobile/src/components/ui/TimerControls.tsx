import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimerControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export default function TimerControls({ isPaused, onPause, onResume, onStop }: TimerControlsProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Pressable onPress={onStop} accessibilityRole="button" accessibilityLabel="Dừng"
        style={({ pressed }) => [styles.slot, pressed && styles.pressed]}>
        <Ionicons name="stop-circle-outline" size={32} color="#FFFFFF" />
      </Pressable>
      <Pressable
        onPress={isPaused ? onResume : onPause}
        accessibilityRole="button"
        accessibilityLabel={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        style={({ pressed }) => [styles.slot, styles.center, pressed && styles.pressed]}>
        <Ionicons name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'} size={48} color="#FFFFFF" />
      </Pressable>
      <View style={styles.slot} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  slot: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  center: { width: 64 },
  pressed: { opacity: 0.85 },
});
