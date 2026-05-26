import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScanFrame from '../../components/ui/ScanFrame';
import CameraControls from '../../components/ui/CameraControls';
import PrimaryButton from '../../components/ui/PrimaryButton';
import RedeemCodeCard from '../../components/ui/RedeemCodeCard';
import ScanEntitlementBadge from '../../components/ui/ScanEntitlementBadge';
import AppRatingPrompt from '../../components/ui/AppRatingPrompt';
import { useFoodScanStore } from '../../stores/foodScanStore';
import { saveFoodLogApi, scanFoodApi } from '../../lib/api/food.api';
import { getFoodItemByBarcodeApi, getScanEntitlementsApi } from '../../lib/api/v2-contracts.api';

export default function ScanScreen() {
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [quotaInfo, setQuotaInfo] = useState<{
    usedToday?: number;
    limit?: number;
    quotaMode?: 'standard_daily_limit' | 'entitlement_30_daily';
  }>({});
  const [ratingVisible, setRatingVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const queryClient = useQueryClient();
  const entitlementQ = useQuery({
    queryKey: ['v2', 'scan-entitlements'],
    queryFn: getScanEntitlementsApi,
  });
  const barcodeMutation = useMutation({
    mutationFn: async (value: string) => getFoodItemByBarcodeApi(value),
    onSuccess: async (result) => {
      if (!result.isSaveReady || !result.minimumNutrition) {
        Alert.alert(
          'Chưa đủ dữ liệu',
          result.message ?? 'Sản phẩm này thiếu dữ liệu dinh dưỡng. Bạn có thể quét ảnh bữa ăn thay thế.',
        );
        return;
      }
      const serving = result.servingSizeG ?? 100;
      const factor = serving / 100;
      await saveFoodLogApi({
        foods: [{
          name: result.name ?? result.minimumNutrition.name,
          weightG: serving,
          calories: result.minimumNutrition.calories * factor,
          protein: result.minimumNutrition.protein * factor,
          carbs: result.minimumNutrition.carbs * factor,
          fat: result.minimumNutrition.fat * factor,
          fiber: (result.fiber ?? 0) * factor,
          sugar: (result.sugar ?? 0) * factor,
          sodium: (result.sodium ?? 0) * factor,
          vitaminC: (result.vitaminC ?? 0) * factor,
          tags: ['barcode', result.source],
        }],
        totals: {
          calories: result.minimumNutrition.calories * factor,
          protein: result.minimumNutrition.protein * factor,
          carbs: result.minimumNutrition.carbs * factor,
          fat: result.minimumNutrition.fat * factor,
        },
        aiProvider: 'manual',
        imageUrl: null,
      });
      await queryClient.invalidateQueries({ queryKey: ['food', 'logs'] });
      setBarcode('');
      Alert.alert('Đã lưu', `${result.name ?? 'Sản phẩm'} đã được thêm vào nhật ký bữa ăn.`);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      Alert.alert('Không thể tra cứu', e.response?.data?.error ?? e.message ?? 'Vui lòng thử lại.');
    },
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

  function handleBarcodeLookup() {
    const normalized = barcode.trim();
    if (!/^\d{6,18}$/.test(normalized)) {
      Alert.alert('Mã vạch chưa hợp lệ', 'Vui lòng nhập 6-18 chữ số, giữ nguyên số 0 ở đầu nếu có.');
      return;
    }
    barcodeMutation.mutate(normalized);
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
          <View style={styles.barcodeCard}>
            <Text style={styles.barcodeTitle}>Tra cứu bằng mã vạch</Text>
            <View style={styles.barcodeRow}>
              <TextInput
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Nhập barcode"
                keyboardType="number-pad"
                style={styles.barcodeInput}
                editable={!barcodeMutation.isPending}
              />
              <Pressable
                style={[styles.barcodeButton, barcodeMutation.isPending && styles.barcodeButtonDisabled]}
                disabled={barcodeMutation.isPending}
                onPress={handleBarcodeLookup}
              >
                <Text style={styles.barcodeButtonText}>
                  {barcodeMutation.isPending ? 'Đang tìm' : 'Lưu'}
                </Text>
              </Pressable>
            </View>
          </View>
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
  barcodeCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  barcodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  barcodeButton: {
    height: 42,
    minWidth: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
  },
  barcodeButtonDisabled: {
    opacity: 0.6,
  },
  barcodeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
