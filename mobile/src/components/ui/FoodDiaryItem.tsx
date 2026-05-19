import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FoodDiaryItemProps {
  foodName: string;
  kcal: number;
  timestamp: string;
  onDelete: () => void;
}

export default function FoodDiaryItem({
  foodName,
  kcal,
  timestamp,
  onDelete,
}: FoodDiaryItemProps): React.JSX.Element {
  const [deleteVisible, setDeleteVisible] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const revealDelete = (): void => {
    setDeleteVisible(true);
    Animated.timing(translateX, {
      toValue: -80,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideDelete = (): void => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDeleteVisible(false);
    });
  };

  const handleLongPress = (): void => {
    if (deleteVisible) {
      hideDelete();
    } else {
      revealDelete();
    }
  };

  const handleDeletePress = (): void => {
    hideDelete();
    onDelete();
  };

  return (
    <View
      style={styles.outer}
      accessibilityLabel={`${foodName}, ${kcal} calo`}
    >
      {/* Delete action layer (revealed on long press) */}
      {deleteVisible ? (
        <Pressable
          style={styles.deleteLayer}
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel="Xóa bữa ăn này"
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      ) : null}

      {/* Content layer */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
      >
        <Pressable
          onLongPress={handleLongPress}
          onPress={deleteVisible ? hideDelete : undefined}
          delayLongPress={400}
          style={styles.contentInner}
          accessibilityRole="button"
        >
          <View style={styles.left}>
            <Text style={styles.foodName} numberOfLines={1}>{foodName}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.kcalValue}>{kcal}</Text>
            <Text style={styles.kcalUnit}> kcal</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  deleteLayer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#EF5350',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 2,
  },
  contentInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '400',
    color: '#BDBDBD',
    marginTop: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  kcalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  kcalUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
});
