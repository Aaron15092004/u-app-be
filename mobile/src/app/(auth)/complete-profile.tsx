import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import AuthInput from '../../components/ui/AuthInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import FormErrorText from '../../components/ui/FormErrorText';
import GoalCard from '../../components/ui/GoalCard';
import type { CompleteProfileRequest } from '../../lib/api/types';

const PRIMARY = '#4CAF50';

type GoalType = 'lose' | 'maintain' | 'gain';

const GOALS: Array<{ label: string; iconName: string; value: GoalType }> = [
  { label: 'Giảm cân', iconName: 'trending-down-outline', value: 'lose' },
  { label: 'Duy trì cân nặng', iconName: 'remove-outline', value: 'maintain' },
  { label: 'Tăng cân / Tăng cơ', iconName: 'trending-up-outline', value: 'gain' },
];

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'Đã xảy ra lỗi, vui lòng thử lại.';
}

export default function CompleteProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const { completeProfile } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // D-30: Block Android hardware back button — user must complete profile
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Field validation
  const ageNum = parseInt(age, 10);
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);

  const ageError =
    age.length > 0 && (isNaN(ageNum) || ageNum < 10 || ageNum > 120)
      ? 'Tuổi không hợp lệ (10–120)'
      : '';
  const heightError =
    height.length > 0 && (isNaN(heightNum) || heightNum < 50 || heightNum > 300)
      ? 'Chiều cao không hợp lệ (50–300 cm)'
      : '';
  const weightError =
    weight.length > 0 && (isNaN(weightNum) || weightNum < 10 || weightNum > 500)
      ? 'Cân nặng không hợp lệ (10–500 kg)'
      : '';

  // D-31: All 5 fields required
  const isFormValid =
    name.trim().length > 0 &&
    !isNaN(ageNum) &&
    ageNum >= 10 &&
    ageNum <= 120 &&
    !isNaN(heightNum) &&
    heightNum >= 50 &&
    heightNum <= 300 &&
    !isNaN(weightNum) &&
    weightNum >= 10 &&
    weightNum <= 500 &&
    goal !== null;

  const handleSubmit = async (): Promise<void> => {
    if (!goal) return;
    setServerError('');
    setLoading(true);
    try {
      const body: CompleteProfileRequest = {
        name: name.trim(),
        age: ageNum,
        heightCm: heightNum,
        weightKg: weightNum,
        goalType: goal,
      };
      await completeProfile(body);
      router.replace('/(tabs)');
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* D-30: No back button */}
      <View style={styles.header}>
        <Text style={styles.title}>Hoàn thiện hồ sơ</Text>
        <Text style={styles.subtitle}>
          Để cá nhân hoá trải nghiệm, hãy cho chúng tôi biết thêm về bạn.
        </Text>
      </View>

      <View style={styles.form}>
        <AuthInput
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
        />

        <AuthInput
          label="Tuổi"
          placeholder="25"
          value={age}
          onChangeText={setAge}
          leftIcon="calendar-outline"
          keyboardType="numeric"
          unitLabel="tuổi"
          error={ageError}
        />

        <AuthInput
          label="Chiều cao"
          placeholder="170"
          value={height}
          onChangeText={setHeight}
          leftIcon="resize-outline"
          keyboardType="decimal-pad"
          unitLabel="cm"
          error={heightError}
        />

        <AuthInput
          label="Cân nặng"
          placeholder="65"
          value={weight}
          onChangeText={setWeight}
          leftIcon="barbell-outline"
          keyboardType="decimal-pad"
          unitLabel="kg"
          error={weightError}
        />

        {/* Goal selector */}
        <Text style={styles.goalLabel}>Mục tiêu của bạn</Text>
        <View style={styles.goalsRow}>
          {GOALS.map((g) => (
            <GoalCard
              key={g.value}
              label={g.label}
              iconName={g.iconName}
              value={g.value}
              selected={goal === g.value}
              onPress={() => setGoal(g.value)}
            />
          ))}
        </View>

        {serverError ? <FormErrorText message={serverError} /> : null}

        <View style={styles.submitButton}>
          <PrimaryButton
            label="Bắt đầu"
            onPress={handleSubmit}
            loading={loading}
            disabled={!isFormValid}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 56,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  subtitle: {
    fontSize: 15,
    color: '#757575',
    marginTop: 8,
    lineHeight: 22,
  },
  form: {},
  goalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  goalsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
});
