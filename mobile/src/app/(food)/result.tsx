import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFoodScanStore } from '../../stores/foodScanStore';
import { saveFoodLogApi } from '../../lib/api/food.api';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ScreenHeader from '../../components/ui/ScreenHeader';
import NutritionSummaryCard from '../../components/ui/NutritionSummaryCard';
import NutritionDetailRow from '../../components/ui/NutritionDetailRow';
import FoodTagPill from '../../components/ui/FoodTagPill';

export default function ResultScreen() {
  const { scanResult, clearScan } = useFoodScanStore();
  const [isSaving, setIsSaving] = useState(false);

  // Guard: if store was cleared, go back
  useEffect(() => {
    if (!scanResult) {
      router.back();
    }
  }, [scanResult]);

  if (!scanResult) {
    return null;
  }

  const firstFood = scanResult.foods[0];

  async function handleSave() {
    if (!scanResult) return;
    setIsSaving(true);
    try {
      await saveFoodLogApi({
        foods: scanResult.foods.map((f) => ({
          name: f.name,
          weightG: f.weightG,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          fiber: f.fiber,
          sugar: f.sugar,
          sodium: f.sodium,
          vitaminC: f.vitaminC,
        })),
        totals: scanResult.totals,
        aiProvider: scanResult.aiProvider,
        imageUrl: null,
      });
      clearScan();
      Alert.alert('', 'Đã lưu bữa ăn!');
      router.push('/(food)/diary');
    } catch {
      setIsSaving(false);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  }

  function handleRetry() {
    clearScan();
    router.back();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          title="Kết quả phân tích"
          subtitle="Thông tin dinh dưỡng bữa ăn"
          showBack={true}
        />

        {/* Food name */}
        <Text style={styles.foodName}>{firstFood?.name ?? 'Bữa ăn'}</Text>

        {/* Tags row */}
        {firstFood?.tags && firstFood.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
            contentContainerStyle={styles.tagsContent}
          >
            {firstFood.tags.map((tag, index) => (
              <FoodTagPill key={index} label={tag} />
            ))}
          </ScrollView>
        )}

        {/* Section heading */}
        <Text style={styles.sectionHeading}>Tổng quan dinh dưỡng</Text>

        {/* Nutrition summary card */}
        <NutritionSummaryCard
          calories={scanResult.totals.calories}
          protein={scanResult.totals.protein}
          carbs={scanResult.totals.carbs}
          fat={scanResult.totals.fat}
        />

        {/* Section heading */}
        <Text style={styles.sectionHeading}>Thông tin chi tiết</Text>

        {/* Micro-nutrient rows */}
        <View style={styles.detailSection}>
          <NutritionDetailRow
            label="Chất xơ"
            value={firstFood?.fiber ?? 0}
            unit="g"
            color="#4CAF50"
          />
          <View style={styles.divider} />
          <NutritionDetailRow
            label="Đường"
            value={firstFood?.sugar ?? 0}
            unit="g"
            color="#FFA726"
          />
          <View style={styles.divider} />
          <NutritionDetailRow
            label="Natri"
            value={firstFood?.sodium ?? 0}
            unit="mg"
            color="#EF5350"
          />
          <View style={styles.divider} />
          <NutritionDetailRow
            label="Vitamin C"
            value={firstFood?.vitaminC ?? 0}
            unit="mg"
            color="#64B5F6"
          />
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          label="Xác nhận & Lưu"
          onPress={handleSave}
          loading={isSaving}
          variant="filled"
        />
        <View style={styles.buttonGap} />
        <PrimaryButton
          label="Chụp lại"
          onPress={handleRetry}
          disabled={isSaving}
          variant="outlined"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  foodName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  tagsScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tagsContent: {
    paddingRight: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  detailSection: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  buttonGap: {
    height: 8,
  },
});
