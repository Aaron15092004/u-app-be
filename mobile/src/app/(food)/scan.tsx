import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import ScanFrame from '../../components/ui/ScanFrame';
import CameraControls from '../../components/ui/CameraControls';
import PrimaryButton from '../../components/ui/PrimaryButton';
import RedeemCodeCard from '../../components/ui/RedeemCodeCard';
import ScanEntitlementBadge from '../../components/ui/ScanEntitlementBadge';
import AppRatingPrompt from '../../components/ui/AppRatingPrompt';
import { useFoodScanStore } from '../../stores/foodScanStore';
import { scanFoodApi } from '../../lib/api/food.api';
import { getFoodItemByBarcodeApi, getScanEntitlementsApi } from '../../lib/api/v2-contracts.api';

export default function ScanScreen() {
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    usedToday?: number;
    limit?: number;
    quotaMode?: 'standard_daily_limit' | 'entitlement_30_daily';
  }>({});
  const [ratingVisible, setRatingVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const lastBarcodeRef = useRef<{ value: string; at: number } | null>(null);
  const entitlementQ = useQuery({
    queryKey: ['v2', 'scan-entitlements'],
    queryFn: getScanEntitlementsApi,
  });
  const barcodeMutation = useMutation({
    mutationFn: async (value: string) => getFoodItemByBarcodeApi(value),
    onSuccess: (result) => {
      if (!result.isSaveReady || !result.minimumNutrition) {
        Alert.alert(
          'Chưa đủ dữ liệu',
          result.message ?? 'Sản phẩm này thiếu dữ liệu dinh dưỡng. Bạn có thể tìm thủ công hoặc quét ảnh bữa ăn.',
        );
        return;
      }
      const serving = result.servingSizeG ?? 100;
      const factor = serving / 100;
      setPendingImageUri(null);
      setScanResult({
        foods: [{
          name: result.name ?? result.minimumNutrition.name,
          weightG: serving,
          calories: result.minimumNutrition.calories * factor,
          protein: result.minimumNutrition.protein * factor,
          carbs: result.minimumNutrition.carbs * factor,
          fat: result.minimumNutrition.fat * factor,
          fiber: (result.fiber ?? 0) * factor,
          sugar: (result.sugar ?? 0) * factor,
          vitamins: { vitaminC: (result.vitaminC ?? 0) * factor },
          minerals: { sodium: (result.sodium ?? 0) * factor },
          tags: ['barcode', result.source],
          source: 'barcode',
          barcode: result.barcode,
          provenance: {
            provider: result.provenance?.provider ?? result.source,
            fetchedAt: result.provenance?.fetchedAt,
            lastVerifiedAt: result.provenance?.lastVerifiedAt,
            productId: result.productId,
          },
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
      setBarcode('');
      setBarcodeMode(false);
      router.push('/(food)/result');
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

  function handleCameraBarcodeScanned(event: { data?: string }) {
    if (!barcodeMode || barcodeMutation.isPending) return;
    const value = String(event.data ?? '').trim();
    if (!/^\d{6,18}$/.test(value)) return;

    const now = Date.now();
    const last = lastBarcodeRef.current;
    if (last && last.value === value && now - last.at < 2500) return;

    lastBarcodeRef.current = { value, at: now };
    setBarcode(value);
    barcodeMutation.mutate(value);
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
            label="Tiếp tục"
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
        onBarcodeScanned={barcodeMode ? handleCameraBarcodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
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
              {barcodeMode ? 'Đưa mã vạch vào khung để tra cứu' : 'Chụp ảnh để phân tích dinh dưỡng'}
            </Text>
          </View>
        </View>

        {/* Scan frame centered */}
        <View style={styles.frameContainer}>
          <ScanFrame />
          {barcodeMode && (
            <Text style={styles.barcodeScanHint}>Đang chờ mã vạch sản phẩm...</Text>
          )}
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
            <View style={styles.barcodeHeader}>
              <Text style={styles.barcodeTitle}>Tra cứu bằng mã vạch</Text>
              <Pressable
                style={[styles.modeButton, barcodeMode && styles.modeButtonActive]}
                onPress={() => setBarcodeMode((value) => !value)}
              >
                <Ionicons name="barcode-outline" size={16} color={barcodeMode ? '#FFFFFF' : '#2E7D32'} />
                <Text style={[styles.modeButtonText, barcodeMode && styles.modeButtonTextActive]}>
                  {barcodeMode ? 'Đang quét' : 'Quét camera'}
                </Text>
              </Pressable>
            </View>
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
                  {barcodeMutation.isPending ? 'Đang tìm' : 'Xem'}
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
  barcodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modeButtonActive: {
    backgroundColor: '#2E7D32',
  },
  modeButtonText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  barcodeScanHint: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
