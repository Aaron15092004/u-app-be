import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

interface DatePillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export default function DatePill({
  label,
  isActive,
  onPress,
}: DatePillProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      style={[
        styles.pill,
        isActive ? styles.pillActive : styles.pillInactive,
      ]}
    >
      <Text
        style={[
          styles.label,
          isActive ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#4CAF50',
  },
  pillInactive: {
    backgroundColor: '#F5F5F5',
  },
  label: {
    fontSize: 14,
  },
  labelActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  labelInactive: {
    fontWeight: '400',
    color: '#212121',
  },
});
