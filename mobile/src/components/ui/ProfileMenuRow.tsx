import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TEXT, TEXT_SECONDARY, BADGE_LOCKED } from '../../constants/colors';

interface ProfileMenuRowProps {
  iconName: string;
  label: string;
  onPress: () => void;
}

export default function ProfileMenuRow({
  iconName,
  label,
  onPress,
}: ProfileMenuRowProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <Ionicons
          name={iconName as React.ComponentProps<typeof Ionicons>['name']}
          size={20}
          color={TEXT_SECONDARY}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={BADGE_LOCKED} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    backgroundColor: '#F5F5F5',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT,
  },
});
