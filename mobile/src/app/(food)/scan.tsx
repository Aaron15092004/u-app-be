import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScanFrame from '../../components/ui/ScanFrame';
import CameraControls from '../../components/ui/CameraControls';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useFoodScanStore } from '../../stores/foodScanStore';
import { scanFoodApi } from '../../lib/api/food.api';

export default function ScanScreen() {
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const { setIsScanning, isScanning, setScanResult, setPendingImageUri } =
    useFoodScanStore();

  async function compressImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async function processImage(uri: string) {
    try {
      setIsScanning(true);
      const compressed = await compressImage(uri);
      setPendingImageUri(compressed);
      const result = await scanFoodApi(compressed);
      setScanResult(result);
      router.push('/(food)/result');
    } catch (err: unknown) {
      setIsScanning(false);
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 429) {
        Alert.alert(
          '',
          'Bạn đã quét 20 lần hôm nay. Vui lòng thử lại vào ngày mai.'
        );
      } else {
        Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    }
  }

  async function handleCapture() {
    if (isScanning) return;
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
    if (!photo) return;
    await processImage(photo.uri);
  }

  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    await processImage(result.assets[0].uri);
  }

  function handleFlash() {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  }

  // Still loading permissions
  if (!permission) {
    return null;
  }

  // Permission denied — show permission request card
  if (permission.status !== 'granted') {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
          <Text style={styles.permissionText}>
            Ứng dụng cần quyền truy cập camera để quét bữa ăn
          </Text>
          <PrimaryButton
            label="Cấp quyền Camera"
            onPress={requestPermission}
          />
          <Pressable onPress={handleGallery} style={styles.galleryLink}>
            <Text style={styles.galleryLinkText}>Chọn từ thư viện</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        flash={flash}
        ref={cameraRef}
      >
        {/* Header overlay */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Quét bữa ăn</Text>
            <Text style={styles.headerSubtitle}>
              Chụp ảnh để phân tích dinh dưỡng
            </Text>
          </View>
        </View>

        {/* Scan frame centered */}
        <View style={styles.frameContainer}>
          <ScanFrame />
          {isScanning && (
            <View style={styles.scanningRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.scanningText}>Đang phân tích...</Text>
            </View>
          )}
        </View>

        {/* Bottom hint and controls */}
        <View style={styles.bottomArea}>
          <Text style={styles.hintText}>
            Nhấn nút chụp hoặc chọn từ thư viện
          </Text>
          <CameraControls
            onGallery={handleGallery}
            onCapture={handleCapture}
            onFlash={handleFlash}
            flashEnabled={flash === 'on'}
            isLoading={isScanning}
          />
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    padding: 4,
    marginTop: 4,
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  frameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanningText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  bottomArea: {
    paddingBottom: 32,
    gap: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  galleryLink: {
    padding: 8,
  },
  galleryLinkText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
});
