import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FoodTagPillProps {
  label: string;
}

export default function FoodTagPill({ label }: FoodTagPillProps): React.JSX.Element {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  label: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '400',
  },
});
