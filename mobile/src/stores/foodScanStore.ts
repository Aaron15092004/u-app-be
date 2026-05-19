import { create } from 'zustand';

export type NutritionFoodItem = {
  name: string;
  weightG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminC: number;
  tags: string[];
};

export type NutritionResult = {
  foods: NutritionFoodItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  aiProvider: 'logmeal' | 'openai' | 'manual';
  imageUrl: string | null;
};

interface FoodScanState {
  scanResult: NutritionResult | null;
  isScanning: boolean;
  pendingImageUri: string | null;
  setScanResult: (result: NutritionResult) => void;
  setIsScanning: (v: boolean) => void;
  setPendingImageUri: (uri: string | null) => void;
  clearScan: () => void;
}

export const useFoodScanStore = create<FoodScanState>((set) => ({
  scanResult: null,
  isScanning: false,
  pendingImageUri: null,
  setScanResult: (result) => set({ scanResult: result, isScanning: false }),
  setIsScanning: (v) => set({ isScanning: v }),
  setPendingImageUri: (uri) => set({ pendingImageUri: uri }),
  clearScan: () => set({ scanResult: null, isScanning: false, pendingImageUri: null }),
}));
