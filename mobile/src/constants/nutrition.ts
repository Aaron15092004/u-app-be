export type NutrMeta = { label: string; unit: string; icon: string; color: string };

export const VITAMIN_META: Record<string, NutrMeta> = {
  vitaminC:   { label: "Vitamin C",   unit: "mg",  icon: "sunny-outline",             color: "#FFB300" },
  vitaminA:   { label: "Vitamin A",   unit: "mcg", icon: "eye-outline",               color: "#FF9800" },
  vitaminD:   { label: "Vitamin D",   unit: "mcg", icon: "partly-sunny-outline",       color: "#FFC107" },
  vitaminE:   { label: "Vitamin E",   unit: "mg",  icon: "leaf-outline",              color: "#8BC34A" },
  vitaminK:   { label: "Vitamin K",   unit: "mcg", icon: "bandage-outline",           color: "#4CAF50" },
  vitaminB1:  { label: "Vitamin B1",  unit: "mg",  icon: "flash-outline",             color: "#03A9F4" },
  vitaminB2:  { label: "Vitamin B2",  unit: "mg",  icon: "flash-outline",             color: "#2196F3" },
  vitaminB3:  { label: "Vitamin B3",  unit: "mg",  icon: "flash-outline",             color: "#9C27B0" },
  vitaminB12: { label: "Vitamin B12", unit: "mcg", icon: "star-outline",              color: "#E91E63" },
  folate:     { label: "Folate (B9)", unit: "mcg", icon: "leaf-outline",              color: "#66BB6A" },
};

export const MINERAL_META: Record<string, NutrMeta> = {
  sodium:     { label: "Natri",   unit: "mg",  icon: "flask-outline",              color: "#78909C" },
  potassium:  { label: "Kali",    unit: "mg",  icon: "thunderstorm-outline",       color: "#9C27B0" },
  calcium:    { label: "Canxi",   unit: "mg",  icon: "git-branch-outline",         color: "#607D8B" },
  magnesium:  { label: "Magie",   unit: "mg",  icon: "cellular-outline",           color: "#00897B" },
  phosphorus: { label: "Phospho", unit: "mg",  icon: "ellipse-outline",            color: "#1976D2" },
  iron:       { label: "Sắt",     unit: "mg",  icon: "barbell-outline",            color: "#D32F2F" },
  zinc:       { label: "Kẽm",     unit: "mg",  icon: "shield-outline",             color: "#455A64" },
  selenium:   { label: "Selen",   unit: "mcg", icon: "shield-checkmark-outline",   color: "#FFA726" },
};
