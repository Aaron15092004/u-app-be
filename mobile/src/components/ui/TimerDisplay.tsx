import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface TimerDisplayProps { remainingSeconds: number; totalSeconds: number; }

function format(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TimerDisplay({ remainingSeconds, totalSeconds }: TimerDisplayProps): React.JSX.Element {
  // totalSeconds reserved for progress ring — UI-SPEC §3.3 (optional v2)
  const mm = Math.floor(Math.max(0, remainingSeconds) / 60);
  const ss = Math.max(0, remainingSeconds) % 60;
  return (
    <View style={styles.container}>
      <Text
        style={styles.digits}
        accessibilityLiveRegion="assertive"
        accessibilityLabel={`Còn lại ${mm} phút ${ss} giây`}
      >
        {format(remainingSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  digits: { fontSize: 80, fontWeight: '700', color: '#FFFFFF', letterSpacing: 4 },
});
