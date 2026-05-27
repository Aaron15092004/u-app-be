import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../components/ui/ScreenHeader';
import AuthInput from '../../components/ui/AuthInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import FormErrorText from '../../components/ui/FormErrorText';
import { resetPasswordApi } from '../../lib/api/auth.api';

const TEXT_SECONDARY = '#757575';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: string; message?: string } } }).response;
    if (resp?.data?.error) return resp.data.error;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
}

export default function ResetPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Invalid / missing token state
  if (!token) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Link không hợp lệ</Text>
        <Text style={styles.errorBody}>
          Link không hợp lệ. Vui lòng yêu cầu lại link mới.
        </Text>
        <PrimaryButton
          variant="outlined"
          label="Quay lại đăng nhập"
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    );
  }

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid =
    password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword;

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setServerError('');
    setLoading(true);
    try {
      await resetPasswordApi(token as string, password);
      router.replace('/(auth)/login');
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
      <ScreenHeader
        showBack
        title="Đặt lại mật khẩu"
        subtitle="Nhập mật khẩu mới cho tài khoản của bạn"
      />

      <View style={styles.form}>
        <AuthInput
          label="Mật khẩu mới"
          placeholder="Tối thiểu 8 ký tự"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((prev) => ({ ...prev, password: undefined }));
            setServerError('');
          }}
          leftIcon="lock-closed-outline"
          secureTextEntry
          error={errors.password}
        />

        <AuthInput
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            setServerError('');
          }}
          leftIcon="lock-closed-outline"
          secureTextEntry
          error={errors.confirmPassword}
        />

        {serverError ? <FormErrorText message={serverError} /> : null}

        <PrimaryButton
          label="Đặt lại mật khẩu"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isFormValid}
        />
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
  },
  form: {
    marginTop: 32,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
