import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';
import FoodSearchBar from '../../components/ui/FoodSearchBar';
import ServingSizeSheet from '../../components/ui/ServingSizeSheet';
import { searchFoodItemsApi, saveFoodLogApi } from '../../lib/api/food.api';
import type { IFoodItem, IFoodLogItem } from '../../lib/api/types';

export default function SearchScreen(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IFoodItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await searchFoodItemsApi(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onChangeText = useCallback(
    (text: string): void => {
      setQuery(text);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (text.length >= 2) {
        debounceTimer.current = setTimeout(() => {
          void fetchResults(text);
        }, 300);
      } else {
        setResults([]);
        setIsLoading(false);
      }
    },
    [fetchResults],
  );

  const handleItemTap = (item: IFoodItem): void => {
    setSelectedItem(item);
    setSheetVisible(true);
  };

  const handleAddToLog = async (grams: number): Promise<void> => {
    if (!selectedItem) return;

    const scale = grams / 100;
    const foodItem: IFoodLogItem = {
      name: selectedItem.name,
      weightG: grams,
      calories: Math.round(selectedItem.kcalPer100g * scale),
      protein: Math.round(selectedItem.protein * scale * 10) / 10,
      carbs: Math.round(selectedItem.carbs * scale * 10) / 10,
      fat: Math.round(selectedItem.fat * scale * 10) / 10,
      fiber: Math.round(selectedItem.fiber * scale * 10) / 10,
      sugar: Math.round(selectedItem.sugar * scale * 10) / 10,
      sodium: Math.round(selectedItem.sodium * scale),
      vitaminC: Math.round(selectedItem.vitaminC * scale * 10) / 10,
    };

    const body = {
      foods: [foodItem],
      totals: {
        calories: Math.round(selectedItem.kcalPer100g * scale),
        protein: Math.round(selectedItem.protein * scale * 10) / 10,
        carbs: Math.round(selectedItem.carbs * scale * 10) / 10,
        fat: Math.round(selectedItem.fat * scale * 10) / 10,
      },
      aiProvider: 'manual' as const,
    };

    try {
      await saveFoodLogApi(body);
      setSheetVisible(false);
      setSelectedItem(null);
      Alert.alert('', 'Đã lưu bữa ăn!');
    } catch {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const renderItem: ListRenderItem<IFoodItem> = ({ item }) => (
    <Pressable
      style={styles.resultCard}
      onPress={() => handleItemTap(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.kcalPer100g} calo mỗi 100 gram`}
    >
      <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.resultKcal}>{item.kcalPer100g}kcal/100g</Text>
    </Pressable>
  );

  const renderContent = (): React.JSX.Element => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      );
    }

    if (query.length >= 2 && results.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color="#BDBDBD" />
          <Text style={styles.emptyHeading}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptyBody}>Thử từ khoá khác hoặc quét ảnh bữa ăn</Text>
        </View>
      );
    }

    if (query.length < 2) {
      return (
        <View style={styles.centered}>
          <Ionicons name="restaurant-outline" size={48} color="#BDBDBD" />
          <Text style={styles.hintText}>Nhập tên món ăn để tìm kiếm</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Tìm kiếm thực phẩm"
        subtitle="Tìm trong cơ sở dữ liệu Việt Nam"
        showBack
      />
      <FoodSearchBar value={query} onChangeText={onChangeText} />
      {renderContent()}
      <ServingSizeSheet
        visible={sheetVisible}
        item={selectedItem}
        onClose={() => {
          setSheetVisible(false);
          setSelectedItem(null);
        }}
        onAdd={(grams) => {
          void handleAddToLog(grams);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  resultKcal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
});
