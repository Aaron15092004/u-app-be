import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STREAK_BADGE, TEXT_SECONDARY, SURFACE } from '../../constants/colors';

interface StreakBadgeProps {
  streakDays: number;
}

export default function StreakBadge({
  streakDays,
}: StreakBadgeProps): React.JSX.Element {
  return (
    <View style={styles.badge}>
      <Ionicons name="flame-outline" size={18} color={STREAK_BADGE} />
      {streakDays > 0 ? (
        <Text style={styles.streakText}>{streakDays} ngày</Text>
      ) : (
        <Text style={styles.emptyText}>Bắt đầu chuỗi ngày của bạn!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: SURFACE,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: STREAK_BADGE,
  },
  emptyText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
});
