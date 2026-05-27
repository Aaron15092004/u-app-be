import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StatusBar,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { saveBMIApi, getBMIHistoryApi } from '../../../lib/api/bmi.api';
import { setCachedUser } from '../../../lib/storage/mmkv';
import BMIResultCard from '../../../components/ui/BMIResultCard';
import BMIChart from '../../../components/ui/BMIChart';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import FormErrorText from '../../../components/ui/FormErrorText';
import { PRIMARY, SURFACE, TEXT, BACKGROUND } from '../../../constants/colors';
import type { IBMICategory } from '../../../lib/api/types';

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------
function computeBMI(heightCm: number, weightKg: number): number {
  return Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
}

function categorizeBMI(bmi: number): IBMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

const CATEGORY_VI: Record<IBMICategory, string> = {
  underweight: 'Thiếu cân',
  normal: 'Bình thường',
  overweight: 'Thừa cân',
  obese: 'Béo phì',
};

const CATEGORY_ADVICE: Record<IBMICategory, string> = {
  underweight: 'Hãy tăng cường dinh dưỡng và tập thể dục để đạt cân nặng khỏe mạnh.',
  normal: 'Duy trì thói quen tốt và tiếp tục phát huy!',
  overweight: 'Tăng cường vận động và điều chỉnh chế độ ăn uống để cải thiện sức khỏe.',
  obese: 'Nên tham khảo ý kiến bác sĩ để có kế hoạch giảm cân an toàn.',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function BMIScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const profileHeight = auth.user?.profile?.heightCm ?? 170;
  const profileWeight = auth.user?.profile?.weightKg ?? 65;

  const [heightCm, setHeightCm] = useState<number>(
    Math.max(100, Math.min(220, profileHeight)),
  );
  const [weightKg, setWeightKg] = useState<number>(
    Math.max(30, Math.min(200, profileWeight)),
  );
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const bmi = useMemo(() => computeBMI(heightCm, weightKg), [heightCm, weightKg]);
  const category = useMemo(() => categorizeBMI(bmi), [bmi]);

  const qc = useQueryClient();
  const historyQuery = useQuery({
    queryKey: ['bmi', 'history'],
    queryFn: getBMIHistoryApi,
  });

  const mutation = useMutation({
    mutationFn: () => saveBMIApi(heightCm, weightKg),
    onSuccess: (result) => {
      setSaveError(null);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
      qc.invalidateQueries({ queryKey: ['bmi', 'history'] });
      qc.invalidateQueries({ queryKey: ['home', 'summary'] });
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          profile: {
            ...currentUser.profile,
            heightCm: result.user.heightCm,
            weightKg: result.user.weightKg,
          },
        };
        useAuthStore.getState().setUser(updatedUser);
        setCachedUser(updatedUser);
      }
    },
    onError: () => {
      setSaveError('Không thể lưu chỉ số BMI. Kiểm tra kết nối và thử lại.');
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <View style={[styles.greenHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Phân tích BMI</Text>
        <Text style={styles.headerSubtitle}>Theo dõi chỉ số cơ thể của bạn</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* BMI Result Card */}
        <View style={styles.resultCardWrapper}>
          <BMIResultCard bmi={bmi} category={category} />
        </View>

        {/* Sliders section */}
        <View style={styles.slidersCard}>
          <Text style={styles.sectionTitle}>Cập nhật số đo</Text>

          {/* Height */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Chiều cao</Text>
            <Text style={[styles.sliderValue, { color: PRIMARY }]}>{heightCm} cm</Text>
          </View>
          <Slider
            minimumValue={100}
            maximumValue={220}
            step={1}
            value={heightCm}
            onValueChange={setHeightCm}
            minimumTrackTintColor={PRIMARY}
            maximumTrackTintColor="#E0E0E0"
            style={styles.slider}
          />

          {/* Weight */}
          <View style={[styles.sliderRow, styles.sliderRowSpacing]}>
            <Text style={styles.sliderLabel}>Cân nặng</Text>
            <Text style={[styles.sliderValue, { color: PRIMARY }]}>{weightKg} kg</Text>
          </View>
          <Slider
            minimumValue={30}
            maximumValue={200}
            step={1}
            value={weightKg}
            onValueChange={setWeightKg}
            minimumTrackTintColor={PRIMARY}
            maximumTrackTintColor="#E0E0E0"
            style={styles.slider}
          />
        </View>

        {/* Save button */}
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label="Lưu số đo"
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
          {saveError !== null && <FormErrorText message={saveError} />}
        </View>

        {/* Advice card */}
        <View style={styles.adviceCard}>
          <Text style={styles.sectionTitle}>Lời khuyên</Text>
          <Text style={styles.adviceText}>{CATEGORY_ADVICE[category]}</Text>
        </View>

        {/* Chart section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Lịch sử 30 ngày</Text>
          <View style={styles.chartCard}>
            <BMIChart records={historyQuery.data ?? []} />
          </View>
        </View>
      </ScrollView>

      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Đã lưu!</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  greenHeader: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  resultCardWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  slidersCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderRowSpacing: {
    marginTop: 16,
  },
  sliderLabel: {
    fontSize: 16,
    color: TEXT,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    marginTop: 4,
  },
  buttonWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  adviceCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  adviceText: {
    fontSize: 16,
    color: TEXT,
    lineHeight: 24,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  chartCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  toastText: {
    color: 'white',
    fontWeight: '700',
  },
});
