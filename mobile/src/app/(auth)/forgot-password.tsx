import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ui/ScreenHeader';
import AuthInput from '../../components/ui/AuthInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import FormErrorText from '../../components/ui/FormErrorText';
import { forgotPasswordApi } from '../../lib/api/auth.api';

const PRIMARY = '#4CAF50';
const TEXT_SECONDARY = '#757575';

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: string; message?: string } } }).response;
    if (resp?.data?.error) return resp.data.error;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'Không thể gửi email. Vui lòng thử lại.';
}

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    if (email.trim() === '') {
      setEmailError('Vui lòng nhập email của bạn');
      return false;
    }
    if (!email.includes('@')) {
      setEmailError('Email không đúng định dạng');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setServerError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setSubmitted(true);
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={64} color={PRIMARY} />
        <Text style={styles.successTitle}>Email đã được gửi!</Text>
        <Text style={styles.successBody}>
          Kiểm tra hộp thư của bạn và nhấn vào link để đặt lại mật khẩu.
        </Text>
        <PrimaryButton
          variant="outlined"
          label="Quay lại đăng nhập"
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        showBack
        title="Quên mật khẩu"
        subtitle="Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu"
      />

      <View style={styles.form}>
        <AuthInput
          label="Email"
          placeholder="example@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
            setServerError('');
          }}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailError}
        />

        {serverError ? <FormErrorText message={serverError} /> : null}

        <PrimaryButton
          label="Gửi link đặt lại"
          onPress={handleSubmit}
          loading={loading}
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
  successContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  successBody: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
