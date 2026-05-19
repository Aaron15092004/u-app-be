import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { updateProfileApi } from '../../../lib/api/users.api';
import { PRIMARY, SURFACE, TEXT, TEXT_SECONDARY } from '../../../constants/colors';

type GoalType = 'lose' | 'maintain' | 'gain';

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'lose', label: 'Giảm cân' },
  { value: 'maintain', label: 'Duy trì' },
  { value: 'gain', label: 'Tăng cân' },
];

export default function EditProfileScreen(): React.JSX.Element {
  const auth = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState<string>(auth.user?.name ?? '');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [waterGoal, setWaterGoal] = useState<number>(8);

  const [nameFocused, setNameFocused] = useState(false);
  const [heightFocused, setHeightFocused] = useState(false);
  const [weightFocused, setWeightFocused] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      updateProfileApi({
        name: name.trim() || undefined,
        heightCm: Number(heightCm) || undefined,
        weightKg: Number(weightKg) || undefined,
        goalType: goalType ?? undefined,
        waterGoal,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['home', 'summary'] });
      void qc.invalidateQueries({ queryKey: ['users', 'profile', 'stats'] });
      void qc.invalidateQueries({ queryKey: ['water', 'today'] });
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Chỉnh sửa hồ sơ" showBack />

          {/* Tên hiển thị */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Tên hiển thị</Text>
            <TextInput
              style={[
                styles.input,
                nameFocused && styles.inputFocused,
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên của bạn"
              placeholderTextColor={TEXT_SECONDARY}
              returnKeyType="next"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          {/* Chiều cao */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Chiều cao (cm)</Text>
            <TextInput
              style={[
                styles.input,
                heightFocused && styles.inputFocused,
              ]}
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="170"
              placeholderTextColor={TEXT_SECONDARY}
              keyboardType="numeric"
              returnKeyType="next"
              onFocus={() => setHeightFocused(true)}
              onBlur={() => setHeightFocused(false)}
            />
          </View>

          {/* Cân nặng */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Cân nặng (kg)</Text>
            <TextInput
              style={[
                styles.input,
                weightFocused && styles.inputFocused,
              ]}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="65"
              placeholderTextColor={TEXT_SECONDARY}
              keyboardType="numeric"
              returnKeyType="done"
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
            />
          </View>

          {/* Mục tiêu sức khỏe */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Mục tiêu sức khỏe</Text>
            <View style={styles.goalRow}>
              {GOAL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setGoalType(opt.value)}
                  style={[
                    styles.goalOption,
                    goalType === opt.value && styles.goalOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.goalOptionText,
                      goalType === opt.value && styles.goalOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Mục tiêu nước mỗi ngày */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Mục tiêu nước mỗi ngày (ly)</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => setWaterGoal((v) => Math.max(4, v - 1))}
                disabled={waterGoal <= 4}
                style={[
                  styles.stepperBtn,
                  styles.stepperBtnOutlined,
                  waterGoal <= 4 && styles.stepperBtnDisabled,
                ]}
              >
                <Text style={[styles.stepperBtnText, styles.stepperBtnTextOutlined]}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{waterGoal}</Text>
              <Pressable
                onPress={() => setWaterGoal((v) => Math.min(16, v + 1))}
                disabled={waterGoal >= 16}
                style={[
                  styles.stepperBtn,
                  styles.stepperBtnFilled,
                  waterGoal >= 16 && styles.stepperBtnDisabled,
                ]}
              >
                <Text style={[styles.stepperBtnText, styles.stepperBtnTextFilled]}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Save button */}
          <View style={styles.saveBlock}>
            <PrimaryButton
              variant="filled"
              label="Lưu thay đổi"
              loading={mutation.isPending}
              onPress={() => mutation.mutate()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  fieldBlock: {
    marginTop: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    fontSize: 16,
    color: TEXT,
    backgroundColor: SURFACE,
  },
  inputFocused: {
    borderColor: PRIMARY,
  },
  // Goal selector
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalOption: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalOptionSelected: {
    borderColor: PRIMARY,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  goalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  goalOptionTextSelected: {
    color: PRIMARY,
  },
  // Water stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  stepperBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnFilled: {
    backgroundColor: PRIMARY,
  },
  stepperBtnOutlined: {
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  stepperBtnTextFilled: {
    color: '#FFFFFF',
  },
  stepperBtnTextOutlined: {
    color: PRIMARY,
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    minWidth: 40,
    textAlign: 'center',
  },
  saveBlock: {
    marginTop: 24,
  },
});
