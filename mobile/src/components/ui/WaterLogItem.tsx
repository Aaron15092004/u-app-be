import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SURFACE, TEXT, TEXT_SECONDARY } from '../../constants/colors';

interface WaterLogItemProps {
  index: number;
  loggedAt: string;
  onDelete?: () => void;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function WaterLogItem({
  index,
  loggedAt,
  onDelete,
}: WaterLogItemProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Ionicons name="water-outline" size={20} color="#64B5F6" style={styles.waterIcon} />
      <View style={styles.info}>
        <Text style={styles.title}>Ly {index}</Text>
        <Text style={styles.time}>{formatTime(loggedAt)}</Text>
      </View>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Xóa ly ${index}`}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={TEXT_SECONDARY} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  waterIcon: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  time: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
});
