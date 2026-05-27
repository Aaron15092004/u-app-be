import React from "react";
import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CameraControlsProps {
  onGallery: () => void;
  onCapture: () => void;
  onFlash: () => void;
  flashEnabled: boolean;
  isLoading: boolean;
}

export default function CameraControls({
  onGallery,
  onCapture,
  onFlash,
  flashEnabled,
  isLoading,
}: CameraControlsProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      {/* Gallery button */}
      <Pressable
        onPress={isLoading ? undefined : onGallery}
        accessibilityRole="button"
        accessibilityLabel="Chọn từ thư viện"
        style={[styles.sideButton, isLoading && styles.disabledBtn]}
      >
        <Ionicons name="image-outline" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Capture button */}
      <View style={styles.captureOuter}>
        <Pressable
          onPress={isLoading ? undefined : onCapture}
          accessibilityRole="button"
          accessibilityLabel="Chụp ảnh"
          accessibilityHint="Chụp ảnh bữa ăn để phân tích dinh dưỡng"
          style={[styles.captureInner, isLoading && styles.disabledBtn]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <Ionicons name="ellipse" size={28} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* Flash button */}
      <Pressable
        onPress={isLoading ? undefined : onFlash}
        accessibilityRole="button"
        accessibilityLabel="Bật/tắt đèn flash"
        accessibilityState={{ selected: flashEnabled }}
        style={[
          styles.sideButton,
          flashEnabled ? styles.flashActive : styles.flashInactive,
          isLoading && styles.disabledBtn,
        ]}
      >
        <Ionicons
          name={flashEnabled ? "flash" : "flash-outline"}
          size={24}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  flashInactive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.4,
  },
});
