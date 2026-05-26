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
import { useQuery } from '@tanstack/react-query';
import ScanFrame from '../../components/ui/ScanFrame';
import CameraControls from '../../components/ui/CameraControls';
import PrimaryButton from '../../components/ui/PrimaryButton';
import RedeemCodeCard from '../../components/ui/RedeemCodeCard';
import ScanEntitlementBadge from '../../components/ui/ScanEntitlementBadge';
import AppRatingPrompt from '../../components/ui/AppRatingPrompt';
import { useFoodScanStore } from '../../stores/foodScanStore';
import { scanFoodApi } from '../../lib/api/food.api';
import { getScanEntitlementsApi } from '../../lib/api/v2-contracts.api';

export default function ScanScreen() {
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    usedToday?: number;
    limit?: number;
    quotaMode?: 'standard_daily_limit' | 'entitlement_30_daily';
  }>({});
  const [ratingVisible, setRatingVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const entitlementQ = useQuery({
    queryKey: ['v2', 'scan-entitlements'],
    queryFn: getScanEntitlementsApi,
  });

  const { setIsScanning, isScanning, setScanResult, setPendingImageUri } =
    useFoodScanStore();

  async function compressImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800, height: 800 } }],
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
      setQuotaBlocked(false);
      setQuotaInfo({
        usedToday: result.usedToday,
        limit: result.limit,
        quotaMode: result.quotaMode,
      });
      setScanResult(result);
      router.push('/(food)/result');
    } catch (err: unknown) {
      setIsScanning(false);
      const e = err as {
        response?: {
          status?: number;
          data?: {
            error?: string;
            retryAfterSeconds?: number;
            usedToday?: number;
            limit?: number;
            quotaMode?: 'standard_daily_limit' | 'entitlement_30_daily';
          };
        };
        message?: string;
      };
      const status = e?.response?.status;
      if (status === 429) {
        const msg = e?.response?.data?.error ?? 'Bạn đã dùng hết lượt quét hôm nay.';
        setQuotaBlocked(true);
        setQuotaInfo({
          usedToday: e.response?.data?.usedToday,
          limit: e.response?.data?.limit,
          quotaMode: e.response?.data?.quotaMode,
        });
        Alert.alert('Hết lượt quét', msg);
      } else if (status === 422) {
        Alert.alert(
          'Không nhận dạng được',
          e?.response?.data?.error ?? 'Không tìm thấy món ăn trong ảnh. Hãy chụp rõ hơn và thử lại.',
        );
      } else if (status === 503) {
        Alert.alert('Tính năng tạm thời không khả dụng', e?.response?.data?.error ?? 'Vui lòng thử lại sau.');
      } else {
        const msg = e?.response?.data?.error ?? e?.message ?? 'Vui lòng kiểm tra kết nối mạng và thử lại.';
        Alert.alert('Quét ảnh thất bại', msg);
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
      mediaTypes: ['images'],
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
          <View style={styles.entitlementWrap}>
            <ScanEntitlementBadge
              status={entitlementQ.data}
              usedToday={quotaInfo.usedToday}
              limit={quotaInfo.limit}
              quotaMode={quotaInfo.quotaMode}
            />
          </View>
          {quotaBlocked && (
            <View style={styles.redeemWrap}>
              <RedeemCodeCard
                title="Nhập mã để tiếp tục quét"
                compact
                onRedeemed={() => {
                  setQuotaBlocked(false);
                  setRatingVisible(true);
                }}
              />
            </View>
          )}
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
        <AppRatingPrompt
          visible={ratingVisible}
          contextNote="Đánh giá sau khi kích hoạt mã scan AI từ màn quét."
          onClose={() => setRatingVisible(false)}
        />
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
    paddingHorizontal: 16,
  },
  entitlementWrap: {
    width: '100%',
  },
  redeemWrap: {
    width: '100%',
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
