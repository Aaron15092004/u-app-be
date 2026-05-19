import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PRIMARY,
  BADGE_UNLOCKED_BG,
  BADGE_LOCKED,
  BADGE_LOCKED_BG,
} from '../../constants/colors';

interface AchievementBadgeProps {
  milestone: number;
  unlocked: boolean;
}

export default function AchievementBadge({
  milestone,
  unlocked,
}: AchievementBadgeProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          { backgroundColor: unlocked ? BADGE_UNLOCKED_BG : BADGE_LOCKED_BG },
        ]}
      >
        <Ionicons
          name="medal-outline"
          size={28}
          color={unlocked ? PRIMARY : BADGE_LOCKED}
        />
      </View>
      <Text
        style={[
          styles.label,
          { color: unlocked ? PRIMARY : BADGE_LOCKED },
        ]}
      >
        {milestone} ngày
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
});
